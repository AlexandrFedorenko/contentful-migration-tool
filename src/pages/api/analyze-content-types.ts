import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulManagement } from "@/utils/contentful-management";
import { AnalyzeContentTypesResponse } from "@/types/api";

interface ContentType {
  sys: {
    id: string;
    type: string;
    version: number;
  };
  name: string;
  description?: string;
  displayField?: string;
  fields: ContentTypeField[];
}

interface ContentTypeField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  localized?: boolean;
}

interface Entry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    updatedAt?: string;
    version?: number;
  };
  fields?: {
    title?: Record<string, string>;
    name?: Record<string, string>;
    [key: string]: any;
  };
}

interface ContentTypeAnalysis {
  id: string;
  name: string;
  isNew: boolean;
  isModified: boolean;
  hasNewContent?: boolean;
  newContentCount?: number;
  modifiedContentCount?: number;
  newEntries?: Array<{
    id: string;
    title?: string;
  }>;
  modifiedEntries?: Array<{
    id: string;
    title?: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeContentTypesResponse>
) {
  res.setTimeout(300000);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { spaceId, sourceEnvironment, targetEnvironment } = req.body;

    if (!spaceId || !sourceEnvironment || !targetEnvironment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: spaceId, sourceEnvironment, or targetEnvironment' 
      });
    }

    if (sourceEnvironment === targetEnvironment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Source and target environments must be different' 
      });
    }

    const sourceContentTypes = await ContentfulManagement.getContentTypes(spaceId, sourceEnvironment);
    const targetContentTypes = await ContentfulManagement.getContentTypes(spaceId, targetEnvironment);
    const sourceEntries = await ContentfulManagement.getEntries(spaceId, sourceEnvironment);
    const targetEntries = await ContentfulManagement.getEntries(spaceId, targetEnvironment);
    
    const analysis = analyzeContentTypesAndContent(sourceContentTypes, targetContentTypes, sourceEntries, targetEntries);

    return res.status(200).json({ 
      success: true,
      contentTypes: analysis
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}

function getEntryTitle(entry: Entry): string {
  if (entry.fields?.title) {
    const titleKeys = Object.keys(entry.fields.title);
    if (titleKeys.length > 0) {
      return entry.fields.title[titleKeys[0]];
    }
  }
  if (entry.fields?.name) {
    const nameKeys = Object.keys(entry.fields.name);
    if (nameKeys.length > 0) {
      return entry.fields.name[nameKeys[0]];
    }
  }
  return entry.sys.id;
}

function analyzeContentTypesAndContent(
  sourceContentTypes: ContentType[], 
  targetContentTypes: ContentType[],
  sourceEntries: Entry[],
  targetEntries: Entry[]
): ContentTypeAnalysis[] {
  const targetContentTypesMap = new Map(targetContentTypes.map(ct => [ct.sys.id, ct]));
  const targetEntriesMap = new Map(targetEntries.map(entry => [entry.sys.id, entry]));

  const analysis: ContentTypeAnalysis[] = [];

  sourceContentTypes.forEach((sourceCT) => {
    const targetCT = targetContentTypesMap.get(sourceCT.sys.id);
    const sourceEntriesForType = sourceEntries.filter(entry => entry.sys.contentType.sys.id === sourceCT.sys.id);
    
    if (!targetCT) {
      const newEntries = sourceEntriesForType.map(entry => ({
        id: entry.sys.id,
        title: getEntryTitle(entry)
      }));
      
      analysis.push({
        id: sourceCT.sys.id,
        name: sourceCT.name,
        isNew: true,
        isModified: false,
        hasNewContent: newEntries.length > 0,
        newContentCount: newEntries.length,
        modifiedContentCount: 0,
        newEntries: newEntries,
        modifiedEntries: []
      });
    } else {
      const isModified = !isContentTypeEqual(sourceCT, targetCT);
      
      const newEntries = sourceEntriesForType
        .filter(sourceEntry => !targetEntriesMap.has(sourceEntry.sys.id))
        .map(entry => ({
          id: entry.sys.id,
          title: getEntryTitle(entry)
        }));
      
      const modifiedEntries = sourceEntriesForType
        .filter(sourceEntry => {
          const targetEntry = targetEntriesMap.get(sourceEntry.sys.id);
          if (!targetEntry) return false;
          
          const sourceVersion = sourceEntry.sys.updatedAt || sourceEntry.sys.version;
          const targetVersion = targetEntry.sys.updatedAt || targetEntry.sys.version;
          
          if (sourceVersion !== targetVersion) {
            return true;
          }
          
          const sourceContentHash = JSON.stringify(sourceEntry.fields);
          const targetContentHash = JSON.stringify(targetEntry.fields);
          return sourceContentHash !== targetContentHash;
        })
        .map(entry => ({
          id: entry.sys.id,
          title: getEntryTitle(entry)
        }));
      
      const hasNewContent = newEntries.length > 0;
      const hasModifiedContent = modifiedEntries.length > 0;
      const totalContentChanges = newEntries.length + modifiedEntries.length;
      
      if (isModified || hasNewContent || hasModifiedContent) {
        analysis.push({
          id: sourceCT.sys.id,
          name: sourceCT.name,
          isNew: false,
          isModified: isModified,
          hasNewContent: totalContentChanges > 0,
          newContentCount: newEntries.length,
          modifiedContentCount: modifiedEntries.length,
          newEntries: newEntries,
          modifiedEntries: modifiedEntries
        });
      }
    }
  });

  return analysis;
}

function isContentTypeEqual(ct1: ContentType, ct2: ContentType): boolean {
  if (ct1.name !== ct2.name || 
      ct1.description !== ct2.description || 
      ct1.displayField !== ct2.displayField) {
    return false;
  }

  if (ct1.fields.length !== ct2.fields.length) {
    return false;
  }

  const sortedFields1 = [...ct1.fields].sort((a, b) => a.id.localeCompare(b.id));
  const sortedFields2 = [...ct2.fields].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < sortedFields1.length; i++) {
    const field1 = sortedFields1[i];
    const field2 = sortedFields2[i];
    
    if (field1.id !== field2.id || 
        field1.name !== field2.name || 
        field1.type !== field2.type ||
        field1.required !== field2.required ||
        field1.localized !== field2.localized) {
      return false;
    }
  }

  return true;
} 
import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulManagement } from "@/utils/contentful-management";
import * as fs from 'fs';
import * as path from 'path';

interface AnalyzeRequest {
  spaceId: string;
  sourceEnvironment: string;
  targetEnvironment: string;
}

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  contentTypes?: Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
    hasNewContent?: boolean;
    newContentCount?: number;
  }>;
}

interface ContentType {
  sys: {
    id: string;
    type: string;
    version: number;
  };
  name: string;
  description?: string;
  displayField?: string;
  fields: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>
) {
  // Увеличиваем таймаут для больших файлов
  res.setTimeout(300000); // 5 минут
  
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

    try {
      console.log('Starting content type analysis using Management API...');
      
      // 1. Get content types from source environment
      console.log(`Fetching content types from source environment: ${sourceEnvironment}`);
      const sourceContentTypes = await ContentfulManagement.getContentTypes(spaceId, sourceEnvironment);
      console.log(`Found ${sourceContentTypes.length} content types in source environment`);

      // 2. Get content types from target environment
      console.log(`Fetching content types from target environment: ${targetEnvironment}`);
      const targetContentTypes = await ContentfulManagement.getContentTypes(spaceId, targetEnvironment);
      console.log(`Found ${targetContentTypes.length} content types in target environment`);

      // 3. Get entries from both environments for content analysis
      console.log('Fetching entries for content analysis...');
      const sourceEntries = await ContentfulManagement.getEntries(spaceId, sourceEnvironment);
      const targetEntries = await ContentfulManagement.getEntries(spaceId, targetEnvironment);
      console.log(`Found ${sourceEntries.length} entries in source, ${targetEntries.length} in target`);

      // 4. Analyze content types and content
      console.log('Analyzing content types and content...');
      const analysis = analyzeContentTypesAndContent(sourceContentTypes, targetContentTypes, sourceEntries, targetEntries);
      console.log(`Analysis completed. Found ${analysis.length} content types with changes`);

      return res.status(200).json({ 
        success: true,
        contentTypes: analysis
      });

    } catch (error) {
      console.error('Analyze content types error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }

  } catch (error) {
    console.error('Analyze content types error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}

// Analyze content types and content to find new/modified types and new content
function analyzeContentTypesAndContent(
  sourceContentTypes: ContentType[], 
  targetContentTypes: ContentType[],
  sourceEntries: any[],
  targetEntries: any[]
) {
  const targetContentTypesMap = new Map(targetContentTypes.map(ct => [ct.sys.id, ct]));
  const targetEntriesMap = new Map(targetEntries.map(entry => [entry.sys.id, entry]));

  const analysis: Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
    hasNewContent?: boolean;
    newContentCount?: number;
  }> = [];

  console.log('Comparing content types and content...');
  
  // Check for new and modified content types
  sourceContentTypes.forEach((sourceCT, index) => {
    console.log(`Processing content type ${index + 1}/${sourceContentTypes.length}: ${sourceCT.name} (${sourceCT.sys.id})`);
    
    const targetCT = targetContentTypesMap.get(sourceCT.sys.id);
    
    if (!targetCT) {
      // New content type
      console.log(`Found NEW content type: ${sourceCT.name}`);
      analysis.push({
        id: sourceCT.sys.id,
        name: sourceCT.name,
        isNew: true,
        isModified: false
      });
    } else {
      // Check if modified by comparing fields
      console.log(`Comparing content type: ${sourceCT.name}`);
      const isModified = !isContentTypeEqual(sourceCT, targetCT);
      
      // Check for new content in this content type
      const sourceEntriesForType = sourceEntries.filter(entry => entry.sys.contentType.sys.id === sourceCT.sys.id);
      const targetEntriesForType = targetEntries.filter(entry => entry.sys.contentType.sys.id === sourceCT.sys.id);
      
      const newEntries = sourceEntriesForType.filter(sourceEntry => 
        !targetEntriesMap.has(sourceEntry.sys.id)
      );
      
      const hasNewContent = newEntries.length > 0;
      
      if (isModified || hasNewContent) {
        console.log(`Found ${isModified ? 'MODIFIED' : ''} ${hasNewContent ? 'WITH NEW CONTENT' : ''} content type: ${sourceCT.name} (${newEntries.length} new entries)`);
        analysis.push({
          id: sourceCT.sys.id,
          name: sourceCT.name,
          isNew: false,
          isModified: isModified,
          hasNewContent: hasNewContent,
          newContentCount: newEntries.length
        });
      }
    }
  });

  console.log('Content type and content analysis completed');
  return analysis;
}

// Compare two content types for equality
function isContentTypeEqual(ct1: ContentType, ct2: ContentType): boolean {
  if (ct1.name !== ct2.name || 
      ct1.description !== ct2.description || 
      ct1.displayField !== ct2.displayField) {
    return false;
  }

  if (ct1.fields.length !== ct2.fields.length) {
    return false;
  }

  // Compare fields (optimized comparison)
  const sortedFields1 = ct1.fields.sort((a, b) => a.id.localeCompare(b.id));
  const sortedFields2 = ct2.fields.sort((a, b) => a.id.localeCompare(b.id));

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
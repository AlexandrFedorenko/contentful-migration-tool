import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";
import * as fs from 'fs';
import * as path from 'path';

interface CustomMigrateRequest {
  spaceId: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  selectedContentTypes: string[];
}

interface CustomMigrateResponse {
  success: boolean;
  error?: string;
  sourceBackupFile?: string;
  targetBackupFile?: string;
  contentTypes?: Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
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

interface BackupData {
  contentTypes: ContentType[];
  entries: any[];
  assets: any[];
  locales: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomMigrateResponse>
) {
  // Увеличиваем таймаут для больших файлов
  res.setTimeout(300000); // 5 минут
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { spaceId, sourceEnvironment, targetEnvironment, selectedContentTypes } = req.body;

    if (!spaceId || !sourceEnvironment || !targetEnvironment || !selectedContentTypes) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: spaceId, sourceEnvironment, targetEnvironment, or selectedContentTypes' 
      });
    }

    if (sourceEnvironment === targetEnvironment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Source and target environments must be different' 
      });
    }

    // Get space name for backup naming
    const space = await ContentfulManagement.getSpace(spaceId);
    const spaceName = space?.name || spaceId;

    try {
      // 1. Create backup of source environment
      console.log(`Creating backup of source environment: ${sourceEnvironment}`);
      const sourceBackupResult = await ContentfulCLI.createBackup(spaceId, sourceEnvironment, spaceName);
      
      if (!sourceBackupResult.success) {
        throw new Error(`Failed to create source environment backup`);
      }

      // Wait a bit to avoid rate limits
      await sleep(2000);

      // 2. Create backup of target environment
      console.log(`Creating backup of target environment: ${targetEnvironment}`);
      const targetBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName);
      
      if (!targetBackupResult.success) {
        throw new Error(`Failed to create target environment backup`);
      }

      // Wait a bit to avoid rate limits
      await sleep(2000);

      // 3. Parse both backup files to analyze content types
      console.log('Analyzing content types from backups...');
      const sourceBackupPath = path.join('/app/backups', spaceId, sourceBackupResult.backupFile!);
      const targetBackupPath = path.join('/app/backups', spaceId, targetBackupResult.backupFile!);

      const sourceData: BackupData = JSON.parse(fs.readFileSync(sourceBackupPath, 'utf8'));
      const targetData: BackupData = JSON.parse(fs.readFileSync(targetBackupPath, 'utf8'));

      // 4. Create selective backup with only selected content types
      console.log('Creating selective backup with selected content types...');
      const selectiveBackup = createSelectiveBackup(sourceData, selectedContentTypes);
      
      // 5. Save selective backup
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const selectiveBackupPath = path.join('/app/backups', spaceId, `selective-migrate-${spaceName}-${sourceEnvironment}-to-${targetEnvironment}-${timestamp}.json`);
      fs.writeFileSync(selectiveBackupPath, JSON.stringify(selectiveBackup, null, 2));

      // 6. Import selective backup to target environment
      console.log('Importing selective backup to target environment...');
      const selectiveFileName = path.basename(selectiveBackupPath);
      const importResult = await ContentfulCLI.restoreBackup(spaceId, selectiveFileName, targetEnvironment);
      
      if (!importResult) {
        throw new Error(`Failed to import selective backup`);
      }

      return res.status(200).json({ 
        success: true,
        sourceBackupFile: sourceBackupResult.backupFile,
        targetBackupFile: targetBackupResult.backupFile
      });

    } catch (error) {
      console.error('Custom migrate error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }

  } catch (error) {
    console.error('Custom migrate error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}

// Utility function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Create selective backup with only selected content types and their related content
function createSelectiveBackup(sourceData: BackupData, selectedContentTypeIds: string[]): BackupData {
  const selectedContentTypes = sourceData.contentTypes.filter(ct => 
    selectedContentTypeIds.includes(ct.sys.id)
  );

  // Get all entries that use selected content types
  const selectedEntries = sourceData.entries.filter(entry => 
    selectedContentTypeIds.includes(entry.sys.contentType.sys.id)
  );

  // Get all assets that are referenced by selected entries
  const referencedAssetIds = new Set<string>();
  selectedEntries.forEach(entry => {
    // Extract asset IDs from entry fields
    extractAssetIds(entry.fields, referencedAssetIds);
  });

  const selectedAssets = sourceData.assets.filter(asset => 
    referencedAssetIds.has(asset.sys.id)
  );

  // Get locales that are used by selected content
  const usedLocaleCodes = new Set<string>();
  selectedEntries.forEach(entry => {
    Object.keys(entry.fields).forEach(fieldName => {
      const fieldValue = entry.fields[fieldName];
      if (fieldValue && typeof fieldValue === 'object') {
        Object.keys(fieldValue).forEach(locale => {
          usedLocaleCodes.add(locale);
        });
      }
    });
  });

  const selectedLocales = sourceData.locales.filter(locale => 
    usedLocaleCodes.has(locale.code)
  );

  return {
    contentTypes: selectedContentTypes,
    entries: selectedEntries,
    assets: selectedAssets,
    locales: selectedLocales
  };
}

// Recursively extract asset IDs from entry fields
function extractAssetIds(fields: any, assetIds: Set<string>) {
  Object.values(fields).forEach(fieldValue => {
    if (fieldValue && typeof fieldValue === 'object') {
      Object.values(fieldValue).forEach((localeValue: any) => {
        if (localeValue && typeof localeValue === 'object') {
          if (localeValue.sys && localeValue.sys.type === 'Asset') {
            assetIds.add(localeValue.sys.id);
          } else if (Array.isArray(localeValue)) {
            localeValue.forEach(item => {
              if (item && item.sys && item.sys.type === 'Asset') {
                assetIds.add(item.sys.id);
              }
            });
          }
        }
      });
    }
  });
}

// Analyze content types to find new and modified ones
export function analyzeContentTypes(sourceData: BackupData, targetData: BackupData) {
  const sourceContentTypes = new Map(sourceData.contentTypes.map(ct => [ct.sys.id, ct]));
  const targetContentTypes = new Map(targetData.contentTypes.map(ct => [ct.sys.id, ct]));

  const analysis: Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
  }> = [];

  // Check for new and modified content types
  sourceContentTypes.forEach((sourceCT, id) => {
    const targetCT = targetContentTypes.get(id);
    
    if (!targetCT) {
      // New content type
      analysis.push({
        id,
        name: sourceCT.name,
        isNew: true,
        isModified: false
      });
    } else {
      // Check if modified by comparing fields
      const isModified = !isContentTypeEqual(sourceCT, targetCT);
      if (isModified) {
        analysis.push({
          id,
          name: sourceCT.name,
          isNew: false,
          isModified: true
        });
      }
    }
  });

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

  // Compare fields (simplified comparison)
  const fields1 = JSON.stringify(ct1.fields.sort((a, b) => a.id.localeCompare(b.id)));
  const fields2 = JSON.stringify(ct2.fields.sort((a, b) => a.id.localeCompare(b.id)));

  return fields1 === fields2;
} 
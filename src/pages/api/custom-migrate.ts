import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";
import { CustomMigrateResponse } from "@/types/api";
import * as fs from 'fs';
import * as path from 'path';

interface CustomMigrateRequest {
  spaceId: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  selectedContentTypes: string[];
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
  fields: ContentTypeField[];
}

interface ContentTypeField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  localized?: boolean;
  [key: string]: any;
}

interface BackupData {
  contentTypes: ContentType[];
  entries: Entry[];
  assets: Asset[];
  locales: Locale[];
  editorInterfaces?: any[];
  roles?: any[];
  webhooks?: any[];
}

interface Entry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: Record<string, any>;
}

interface Asset {
  sys: {
    id: string;
    type: string;
  };
  [key: string]: any;
}

interface Locale {
  code: string;
  [key: string]: any;
}

const BACKUP_DELAY = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomMigrateResponse>
) {
  res.setTimeout(300000);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { spaceId, sourceEnvironment, targetEnvironment, selectedContentTypes, action = 'preview', selectiveBackupFile }: CustomMigrateRequest & { action?: 'preview' | 'execute', selectiveBackupFile?: string } = req.body;

    if (!spaceId || !sourceEnvironment || !targetEnvironment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: spaceId, sourceEnvironment, targetEnvironment'
      });
    }

    if (sourceEnvironment === targetEnvironment) {
      return res.status(400).json({
        success: false,
        error: 'Source and target environments must be different'
      });
    }

    const space = await ContentfulManagement.getSpace(spaceId);
    const spaceName = space?.name || spaceId;
    const backupDir = path.join(process.cwd(), 'backups', spaceId);

    if (action === 'preview') {
      if (!selectedContentTypes || selectedContentTypes.length === 0) {
        return res.status(400).json({ success: false, error: 'No content types selected for preview' });
      }

      // 1. Backup Source
      const sourceBackupResult = await ContentfulCLI.createBackup(spaceId, sourceEnvironment, spaceName);
      if (!sourceBackupResult.success || !sourceBackupResult.backupFile) {
        throw new Error('Failed to create source environment backup');
      }

      // 2. Filter & Create Selective Backup
      const sourceBackupPath = path.join(backupDir, sourceBackupResult.backupFile);
      const sourceData: BackupData = JSON.parse(fs.readFileSync(sourceBackupPath, 'utf8'));
      const selectiveBackup = createSelectiveBackup(sourceData, selectedContentTypes);

      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const selectiveBackupPath = path.join(backupDir, `selective-migrate-${spaceName}-${sourceEnvironment}-to-${targetEnvironment}-${timestamp}.json`);
      fs.writeFileSync(selectiveBackupPath, JSON.stringify(selectiveBackup, null, 2));

      return res.status(200).json({
        success: true,
        sourceBackupFile: sourceBackupResult.backupFile,
        previewData: {
          entriesCount: selectiveBackup.entries.length,
          assetsCount: selectiveBackup.assets.length,
          contentTypesCount: selectiveBackup.contentTypes.length,
          localesCount: selectiveBackup.locales.length,
          selectiveBackupFile: path.basename(selectiveBackupPath)
        }
      });

    } else if (action === 'execute') {
      if (!selectiveBackupFile) {
        return res.status(400).json({ success: false, error: 'Missing selectiveBackupFile for execution' });
      }

      // 3. Backup Target (Rollback safety)
      const targetBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName);
      if (!targetBackupResult.success || !targetBackupResult.backupFile) {
        throw new Error('Failed to create target environment backup');
      }

      // 4. Restore Selective Backup
      await ContentfulCLI.restoreBackup(spaceId, selectiveBackupFile, targetEnvironment);

      return res.status(200).json({
        success: true,
        targetBackupFile: targetBackupResult.backupFile
      });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

function createSelectiveBackup(sourceData: BackupData, selectedContentTypeIds: string[]): BackupData {
  const selectedContentTypes = sourceData.contentTypes.filter(ct =>
    selectedContentTypeIds.includes(ct.sys.id)
  );

  const selectedEntries = sourceData.entries.filter(entry =>
    selectedContentTypeIds.includes(entry.sys.contentType.sys.id)
  );

  const referencedAssetIds = new Set<string>();
  selectedEntries.forEach(entry => {
    extractAssetIds(entry.fields, referencedAssetIds);
  });

  const selectedAssets = sourceData.assets.filter(asset =>
    referencedAssetIds.has(asset.sys.id)
  );

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
    locales: selectedLocales,
    editorInterfaces: sourceData.editorInterfaces?.filter(ei =>
      selectedContentTypeIds.includes(ei.sys.contentType.sys.id)
    ) || [],
    roles: [],
    webhooks: []
  };
}

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

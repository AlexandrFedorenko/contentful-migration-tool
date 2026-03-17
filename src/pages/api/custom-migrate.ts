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

import { BackupData } from "@/types/backup";


import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomMigrateResponse>
) {
  res.setTimeout(300000);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || !user.contentfulToken) {
      return res.status(400).json({ success: false, error: "Contentful token not found" });
    }
    const token = decrypt(user.contentfulToken);

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

    const space = await ContentfulManagement.getSpace(spaceId, token);
    const spaceName = space?.name || spaceId;
    const backupDir = path.join(process.cwd(), 'backups', spaceId);

    if (action === 'preview') {
      if (!selectedContentTypes || selectedContentTypes.length === 0) {
        return res.status(400).json({ success: false, error: 'No content types selected for preview' });
      }


      const sourceBackupResult = await ContentfulCLI.createBackup(spaceId, sourceEnvironment, spaceName, token);
      if (!sourceBackupResult.success || !sourceBackupResult.backupFile) {
        throw new Error('Failed to create source environment backup');
      }


      const sourceBackupPath = path.join(backupDir, sourceBackupResult.backupFile);
      const sourceData: BackupData = JSON.parse(fs.readFileSync(sourceBackupPath, 'utf8'));
      const selectiveBackup = createSelectiveBackup(sourceData, selectedContentTypes);

      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const selectiveBackupPath = path.join(backupDir, `selective-migrate-${spaceName}-${sourceEnvironment}-to-${targetEnvironment}-${timestamp}.json`);
      fs.writeFileSync(selectiveBackupPath, JSON.stringify(selectiveBackup, null, 2));

      return res.status(200).json({
        success: true,
        data: {
          sourceBackupFile: sourceBackupResult.backupFile,
          previewData: {
            entriesCount: selectiveBackup.entries?.length || 0,
            assetsCount: selectiveBackup.assets?.length || 0,
            contentTypesCount: selectiveBackup.contentTypes?.length || 0,
            localesCount: selectiveBackup.locales?.length || 0,
            selectiveBackupFile: path.basename(selectiveBackupPath)
          }
        }
      });

    } else if (action === 'execute') {
      if (!selectiveBackupFile) {
        return res.status(400).json({ success: false, error: 'Missing selectiveBackupFile for execution' });
      }


      const targetBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName, token);
      if (!targetBackupResult.success || !targetBackupResult.backupFile) {
        throw new Error('Failed to create target environment backup');
      }


      await ContentfulCLI.restoreBackup(spaceId, selectiveBackupFile, targetEnvironment, token);

      return res.status(200).json({
        success: true,
        data: {
          targetBackupFile: targetBackupResult.backupFile
        }
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
  const contentTypes = sourceData.contentTypes || [];
  const selectedContentTypes = contentTypes.filter(ct =>
    selectedContentTypeIds.includes(ct.sys.id)
  );

  const entries = sourceData.entries || [];
  const selectedEntries = entries.filter(entry =>
    selectedContentTypeIds.includes(entry.sys.contentType.sys.id)
  );

  const referencedAssetIds = new Set<string>();
  selectedEntries.forEach(entry => {
    if (entry.fields) {
      extractAssetIds(entry.fields, referencedAssetIds);
    }
  });

  const assets = sourceData.assets || [];
  const selectedAssets = assets.filter(asset =>
    referencedAssetIds.has(asset.sys.id)
  );

  const usedLocaleCodes = new Set<string>();
  selectedEntries.forEach(entry => {
    if (entry.fields) {
      Object.keys(entry.fields).forEach(fieldName => {
        const fieldValue = entry.fields![fieldName];
        if (fieldValue && typeof fieldValue === 'object') {
          Object.keys(fieldValue).forEach(locale => {
            usedLocaleCodes.add(locale);
          });
        }
      });
    }
  });

  const locales = sourceData.locales || [];
  const selectedLocales = locales.filter(locale =>
    usedLocaleCodes.has(locale.code)
  );

  // Filter editor interfaces if they exist
  let editorInterfaces: unknown[] = [];
  if (sourceData.editorInterfaces) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editorInterfaces = sourceData.editorInterfaces.filter((ei: any) =>
      selectedContentTypeIds.includes(ei.sys.contentType.sys.id)
    );
  }

  return {
    contentTypes: selectedContentTypes,
    entries: selectedEntries,
    assets: selectedAssets,
    locales: selectedLocales,
    editorInterfaces: editorInterfaces
  };
}

function extractAssetIds(fields: Record<string, unknown>, assetIds: Set<string>) {
  Object.values(fields).forEach(fieldValue => {
    if (fieldValue && typeof fieldValue === 'object') {
      Object.values(fieldValue as Record<string, unknown>).forEach((localeValue: unknown) => {
        if (localeValue && typeof localeValue === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sys = (localeValue as any).sys;
          if (sys && sys.type === 'Asset') {
            assetIds.add(sys.id);
          } else if (Array.isArray(localeValue)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            localeValue.forEach((item: any) => {
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

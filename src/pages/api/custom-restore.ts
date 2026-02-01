import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";
import { CustomRestoreResponse } from "@/types/api";
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'cross-spawn';

interface CustomRestoreRequest {
  spaceId: string;
  targetEnvironment: string;
  fileContent: string;
  fileName: string;
}

const BACKUP_DELAY = 2000;
const DELETE_DELAY = 3000;
const CREATE_DELAY = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomRestoreResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { spaceId, targetEnvironment, fileContent, fileName }: CustomRestoreRequest = req.body;

    if (!spaceId || !targetEnvironment || !fileContent || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: spaceId, targetEnvironment, fileContent, or fileName'
      });
    }

    if (targetEnvironment === 'master') {
      return res.status(400).json({
        success: false,
        error: 'Cannot replace master environment for safety reasons'
      });
    }

    const backupDir = path.join(process.cwd(), 'backups', spaceId);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Sanitize filename and prepend timestamp
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const tempFilePath = path.join(backupDir, `${Date.now()}-${sanitizedFileName}`);
    fs.writeFileSync(tempFilePath, fileContent);

    const space = await ContentfulManagement.getSpace(spaceId);
    const spaceName = space?.name || spaceId;

    try {
      const currentBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName);

      if (!currentBackupResult.success || !currentBackupResult.backupFile) {
        throw new Error('Failed to create backup of current environment');
      }

      await sleep(BACKUP_DELAY);

      const environmentExists = await checkEnvironmentExists(spaceId, targetEnvironment);

      if (!environmentExists) {
        throw new Error(`Environment ${targetEnvironment} does not exist`);
      }

      await deleteEnvironment(spaceId, targetEnvironment);
      await sleep(DELETE_DELAY);
      await createEnvironment(spaceId, targetEnvironment);
      await sleep(CREATE_DELAY);

      const fileName = path.basename(tempFilePath);
      await ContentfulCLI.restoreBackup(spaceId, fileName, targetEnvironment);

      return res.status(200).json({
        success: true,
        backupFile: currentBackupResult.backupFile
      });

    } finally {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {
      }
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

async function checkEnvironmentExists(spaceId: string, environmentId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const checkProcess = spawn('contentful', [
      'space', 'environment', 'list',
      '--space-id', spaceId
    ], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';

    if (checkProcess.stdout) {
      checkProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
    }

    if (checkProcess.stderr) {
      checkProcess.stderr.on('data', () => {
      });
    }

    checkProcess.on('close', (code: number) => {
      if (code === 0) {
        const exists = output.includes(environmentId);
        resolve(exists);
      } else {
        reject(new Error(`Failed to check environment existence: ${output}`));
      }
    });
  });
}

async function deleteEnvironment(spaceId: string, environmentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteProcess = spawn('contentful', [
      'space', 'environment', 'delete',
      '--space-id', spaceId,
      '--environment-id', environmentId
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    if (deleteProcess.stdin) {
      deleteProcess.stdin.write('y\n');
    }

    let output = '';

    if (deleteProcess.stdout) {
      deleteProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
    }

    if (deleteProcess.stderr) {
      deleteProcess.stderr.on('data', () => {
      });
    }

    deleteProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to delete environment: ${output}`));
      }
    });
  });
}

async function createEnvironment(spaceId: string, environmentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const createProcess = spawn('contentful', [
      'space', 'environment', 'create',
      '--space-id', spaceId,
      '--environment-id', environmentId,
      '--name', environmentId
    ], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';

    if (createProcess.stdout) {
      createProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
    }

    if (createProcess.stderr) {
      createProcess.stderr.on('data', () => {
      });
    }

    createProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to create environment: ${output}`));
      }
    });
  });
} 
import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from "@/utils/contentful-cli";
import { ContentfulManagement } from "@/utils/contentful-management";
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'cross-spawn';

interface CustomRestoreResponse {
  success: boolean;
  error?: string;
  backupFile?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomRestoreResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { spaceId, targetEnvironment, fileContent } = req.body;

    if (!spaceId || !targetEnvironment || !fileContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: spaceId, targetEnvironment, or fileContent' 
      });
    }

    // Validate environment name (don't allow deleting master)
    if (targetEnvironment === 'master') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot replace master environment for safety reasons' 
      });
    }

    // Save uploaded file temporarily in backups directory
    const backupDir = path.join('/app/backups', spaceId);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const tempFilePath = path.join(backupDir, `custom-restore-${Date.now()}.json`);
    fs.writeFileSync(tempFilePath, fileContent);

    // Get space name for backup naming
    const space = await ContentfulManagement.getSpace(spaceId);
    const spaceName = space?.name || spaceId;

    try {
      // 1. Create backup of current environment
      console.log(`Creating backup of current environment: ${targetEnvironment}`);
      const currentBackupResult = await ContentfulCLI.createBackup(spaceId, targetEnvironment, spaceName);
      
      if (!currentBackupResult.success) {
        throw new Error(`Failed to create backup of current environment`);
      }

      // Wait a bit to avoid rate limits
      await sleep(2000);

      // 2. Check if environment exists before deleting
      console.log(`Checking if environment ${targetEnvironment} exists...`);
      const environmentExists = await checkEnvironmentExists(spaceId, targetEnvironment);
      
      if (!environmentExists) {
        throw new Error(`Environment ${targetEnvironment} does not exist`);
      }

      // 3. Delete the target environment
      console.log(`Deleting environment: ${targetEnvironment}`);
      await deleteEnvironment(spaceId, targetEnvironment);

      // Wait for deletion to complete
      await sleep(3000);

      // 4. Create new environment with the same name
      console.log(`Creating new environment: ${targetEnvironment}`);
      await createEnvironment(spaceId, targetEnvironment);

      // Wait for creation to complete
      await sleep(2000);

      // 5. Import the uploaded file to new environment
      console.log(`Importing uploaded file to new environment: ${tempFilePath}`);
      const fileName = path.basename(tempFilePath);
      const importResult = await ContentfulCLI.restoreBackup(spaceId, fileName, targetEnvironment);
      
      if (!importResult) {
        throw new Error(`Failed to import backup`);
      }

      return res.status(200).json({ 
        success: true,
        backupFile: currentBackupResult.backupFile
      });

    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }

  } catch (error) {
    console.error('Custom restore error:', error);
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

// Check if environment exists
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
    
    checkProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    
    checkProcess.stderr.on('data', (data: Buffer) => {
      console.error('Check environment error:', data.toString());
    });
    
    checkProcess.on('close', (code: number) => {
      if (code === 0) {
        // Check if environment exists in the list
        const exists = output.includes(environmentId);
        resolve(exists);
      } else {
        reject(new Error(`Failed to check environment existence: ${output}`));
      }
    });
  });
}

// Delete environment
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

    // Automatically answer "yes" to confirmation
    deleteProcess.stdin.write('y\n');
    
    let output = '';
    
    deleteProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
      console.log('Delete output:', data.toString());
    });
    
    deleteProcess.stderr.on('data', (data: Buffer) => {
      console.error('Delete error:', data.toString());
    });
    
    deleteProcess.on('close', (code: number) => {
      if (code === 0) {
        console.log('Environment deleted successfully');
        resolve();
      } else {
        reject(new Error(`Failed to delete environment: ${output}`));
      }
    });
  });
}

// Create environment
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
    
    createProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
      console.log('Create output:', data.toString());
    });
    
    createProcess.stderr.on('data', (data: Buffer) => {
      console.error('Create error:', data.toString());
    });
    
    createProcess.on('close', (code: number) => {
      if (code === 0) {
        console.log('Environment created successfully');
        resolve();
      } else {
        reject(new Error(`Failed to create environment: ${output}`));
      }
    });
  });
} 
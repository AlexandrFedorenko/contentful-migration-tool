import { spawn } from 'cross-spawn';
import * as path from 'path';
import * as fs from 'fs';

const CONTENTFUL_OAUTH_CLIENT_ID = process.env.CONTENTFUL_OAUTH_CLIENT_ID || '9f86a1d54f3d6f85c159468f5919d6e5d27716b3ed68fd01bd534e3dea2df864';
const CONTENTFUL_OAUTH_REDIRECT_URI = process.env.CONTENTFUL_OAUTH_REDIRECT_URI || 'https://www.contentful.com/developers/cli-oauth-page/';
const CONTENTFUL_OAUTH_SCOPE = process.env.CONTENTFUL_OAUTH_SCOPE || 'content_management_manage';

export class ContentfulCLI {
  static getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'token',
      client_id: CONTENTFUL_OAUTH_CLIENT_ID,
      redirect_uri: CONTENTFUL_OAUTH_REDIRECT_URI,
      scope: CONTENTFUL_OAUTH_SCOPE,
    });
    return `https://be.contentful.com/oauth/authorize?${params.toString()}`;
  }

  static async checkAuthStatus(): Promise<{ loggedIn: boolean; config?: string }> {
    if (process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      return { loggedIn: true, config: 'env' };
    }

    try {
      const homedir = require('os').homedir();
      const configPath = path.join(homedir, '.contentfulrc.json');
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(fileContent);
        if (config.managementToken) {
          return { loggedIn: true, config: 'file' };
        }
      }
    } catch (error) {
      // Ignore error
    }

    return { loggedIn: false };
  }

  static async saveToken(token: string): Promise<void> {
    const homedir = require('os').homedir();
    const configPath = path.join(homedir, '.contentfulrc.json');
    let config: any = {};

    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(fileContent);
      } catch (e) {
        // Ignore error, start with empty config
      }
    }

    config.managementToken = token;
    // Also set the environment variable for the current process usage
    process.env.CONTENTFUL_MANAGEMENT_TOKEN = token;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  static async logout(): Promise<boolean> {
    try {
      const homedir = require('os').homedir();
      const configPath = path.join(homedir, '.contentfulrc.json');

      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(fileContent);

        if (config.managementToken) {
          delete config.managementToken;
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        }
      }

      delete process.env.CONTENTFUL_MANAGEMENT_TOKEN;
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }
  static async createBackup(
    spaceId: string,
    environmentId: string,
    spaceName: string,
    onLog?: (message: string) => void
  ): Promise<{ success: boolean; backupFile?: string }> {
    return new Promise((resolve) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(process.cwd(), 'backups', spaceId);
      const backupFile = path.join(backupDir, `${spaceName}-${environmentId}-${timestamp}.json`);

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      onLog?.(`Starting export for space: ${spaceId}, environment: ${environmentId}`);
      onLog?.(`Backup file: ${backupFile}`);

      const exportProcess = spawn('contentful', [
        'space', 'export',
        '--space-id', spaceId,
        '--environment-id', environmentId,
        '--content-file', backupFile,
        '--skip-roles',
        '--skip-webhooks'
      ], {
        env: { ...process.env, PATH: process.env.PATH }
      });

      if (exportProcess.stdout) {
        exportProcess.stdout.on('data', (data) => {
          onLog?.(data.toString());
        });
      }

      if (exportProcess.stderr) {
        exportProcess.stderr.on('data', (data) => {
          onLog?.(data.toString());
        });
      }

      exportProcess.on('close', (code) => {
        if (code === 0) {
          onLog?.('Export completed successfully.');
          resolve({ success: true, backupFile: path.basename(backupFile) });
        } else {
          onLog?.(`Export failed with code ${code}`);
          resolve({ success: false });
        }
      });
    });
  }

  static async restoreBackup(
    spaceId: string,
    fileName: string,
    environmentId: string,
    onLog?: (message: string) => void,
    skipPublishing: boolean = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const backupFilePath = path.join(process.cwd(), 'backups', spaceId, fileName);

      if (!fs.existsSync(backupFilePath)) {
        reject(new Error(`Backup file not found: ${backupFilePath}`));
        return;
      }

      onLog?.(`Starting import to space: ${spaceId}, environment: ${environmentId}`);
      onLog?.(`Using backup file: ${fileName}`);
      if (skipPublishing) {
        onLog?.('Skipping content publishing (all items will be Draft).');
      }

      const args = [
        'space', 'import',
        '--space-id', spaceId,
        '--environment-id', environmentId,
        '--content-file', backupFilePath,
        '--content-model-only', 'false'
      ];

      if (skipPublishing) {
        args.push('--skip-content-publishing');
      }

      const importProcess = spawn('contentful', args, {
        env: { ...process.env, PATH: process.env.PATH }
      });

      let errorOutput = '';

      if (importProcess.stdout) {
        importProcess.stdout.on('data', (data) => {
          onLog?.(data.toString());
        });
      }

      if (importProcess.stderr) {
        importProcess.stderr.on('data', (data) => {
          const text = data.toString();
          errorOutput += text;
          onLog?.(text);
        });
      }

      importProcess.on('close', (code) => {
        if (code === 0) {
          onLog?.('Import completed successfully.');
          resolve();
        } else {
          reject(new Error(`Import failed with code ${code}. Details: ${errorOutput}`));
        }
      });
    });
  }
}

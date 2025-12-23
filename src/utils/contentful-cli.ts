import { spawn } from 'cross-spawn';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONTENTFUL_OAUTH_CLIENT_ID = process.env.CONTENTFUL_OAUTH_CLIENT_ID || '9f86a1d54f3d6f85c159468f5919d6e5d27716b3ed68fd01bd534e3dea2df864';
const CONTENTFUL_OAUTH_REDIRECT_URI = process.env.CONTENTFUL_OAUTH_REDIRECT_URI || 'https://www.contentful.com/developers/cli-oauth-page/';
const CONTENTFUL_OAUTH_SCOPE = process.env.CONTENTFUL_OAUTH_SCOPE || 'content_management_manage';

export class ContentfulCLI {
  static async getAuthUrl(): Promise<{ browser_url: string }> {
    const authUrl = `https://be.contentful.com/oauth/authorize?response_type=token&client_id=${CONTENTFUL_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONTENTFUL_OAUTH_REDIRECT_URI)}&scope=${CONTENTFUL_OAUTH_SCOPE}`;
    
    return { browser_url: authUrl };
  }
  
  static async saveToken(token: string): Promise<boolean> {
    const cliProcess = spawn('contentful', ['config', 'add', '--management-token', token], { 
      stdio: 'pipe',
      shell: true
    });
    
    return new Promise((resolve, reject) => {
      cliProcess.on('close', (code: number) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Failed to save token, exit code: ${code}`));
        }
      });
      
      if (cliProcess.stderr) {
        cliProcess.stderr.on('data', () => {
        });
      }
    });
  }
  
  static async checkAuthStatus(): Promise<{ loggedIn: boolean; config?: string }> {
    try {
      const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
      if (token) {
        return { 
          loggedIn: true,
          config: `managementToken: ${token.substring(0, 5)}...`
        };
      }
      
      const checkProcess = spawn('contentful', ['config', 'list'], { 
        stdio: 'pipe',
        shell: true
      });
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        if (checkProcess.stdout) {
          checkProcess.stdout.on('data', (data: Buffer) => {
            output += data.toString();
          });
        }
        
        checkProcess.on('close', (code: number) => {
          if (code === 0) {
            const isLoggedIn = output.includes('managementToken');
            
            if (isLoggedIn) {
              const tokenMatch = output.match(/managementToken: ([^\s]+)/);
              if (tokenMatch) {
                process.env.CONTENTFUL_MANAGEMENT_TOKEN = tokenMatch[1];
              }
            }
            
            resolve({
              loggedIn: isLoggedIn,
              config: isLoggedIn ? output : undefined
            });
          } else {
            resolve({ loggedIn: false });
          }
        });
        
        setTimeout(() => {
          checkProcess.kill();
          resolve({ loggedIn: false });
        }, 5000);
      });
    } catch {
      return { loggedIn: false };
    }
  }
  
  static isContentfulCliAvailable(): boolean {
    try {
      const localPath = path.join(process.cwd(), 'node_modules', '.bin', 'contentful');
      if (fs.existsSync(localPath)) {
        return true;
      }
      
      if (process.platform !== 'win32') {
        const result = spawnSync('which', ['contentful'], { stdio: 'pipe' });
        return result.status === 0;
      }
      
      const result = spawnSync('where', ['contentful'], { stdio: 'pipe', shell: true });
      return result.status === 0;
    } catch {
      return false;
    }
  }
  
  static async logout(): Promise<boolean> {
    if (process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      delete process.env.CONTENTFUL_MANAGEMENT_TOKEN;
    }
    
    const configRemoved = await this.removeConfigFile();
    
    try {
      const authCachePath = path.join(process.cwd(), '.auth-cache.json');
      if (fs.existsSync(authCachePath)) {
        fs.unlinkSync(authCachePath);
      }
    } catch {
    }
    
    return configRemoved;
  }
  
  private static async removeConfigFile(): Promise<boolean> {
    try {
      const configPath = path.join(os.homedir(), '.contentfulrc.json');
      
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        return true;
      }
      return true;
    } catch {
      return false;
    }
  }
  
  static async createBackup(spaceId: string, environmentId: string, spaceName?: string): Promise<{ success: boolean; backupFile?: string }> {
    try {
      const backupDir = path.join(process.cwd(), 'backups', spaceId);
      fs.mkdirSync(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const safeSpaceName = (spaceName || spaceId).replace(/[^a-zA-Z0-9-_]/g, '_');
      const backupFile = path.join(backupDir, `backup-${safeSpaceName}-${environmentId}-${timestamp}.json`);
      
      const exportProcess = spawn('contentful', [
        'space', 'export',
        '--space-id', spaceId,
        '--environment-id', environmentId,
        '--content-file', backupFile,
        '--include-drafts',
        '--include-archived',
        '--save-file'
      ], { 
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      if (exportProcess.stdin) {
        exportProcess.stdin.write('y\ny\ny\ny\ny\n');
      }
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        if (exportProcess.stdout) {
          exportProcess.stdout.on('data', (data: Buffer) => {
            output += data.toString();
          });
        }
        
        if (exportProcess.stderr) {
          exportProcess.stderr.on('data', () => {
          });
        }
        
        exportProcess.on('close', (code: number) => {
          if (code === 0) {
            resolve({
              success: true,
              backupFile: path.basename(backupFile)
            });
          } else {
            reject(new Error(`Failed to create backup: ${output}`));
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }
  
  static async restoreBackup(spaceId: string, fileName: string, targetEnvironment: string): Promise<boolean> {
    try {
      const backupFile = path.join(process.cwd(), 'backups', spaceId, fileName);
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }
      
      const importProcess = spawn('contentful', [
        'space', 'import',
        '--space-id', spaceId,
        '--environment-id', targetEnvironment,
        '--content-file', backupFile
      ], { 
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      if (importProcess.stdin) {
        importProcess.stdin.write('y\ny\ny\ny\ny\n');
      }
      
      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';
        
        if (importProcess.stdout) {
          importProcess.stdout.on('data', (data: Buffer) => {
            output += data.toString();
          });
        }
        
        if (importProcess.stderr) {
          importProcess.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });
        }
        
        importProcess.on('close', async (code: number) => {
          if (code === 0) {
            resolve(true);
          } else {
            const fullOutput = output + errorOutput;
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            let jsonLogPath = null;
            try {
              const appFiles = fs.readdirSync('/app');
              const jsonLogFile = appFiles.find(file => 
                file.includes('contentful-import-error-log') && file.endsWith('.json')
              );
              
              if (jsonLogFile) {
                jsonLogPath = `/app/${jsonLogFile}`;
              }
            } catch {
            }
            
            if (jsonLogPath) {
              try {
                const jsonLogContent = fs.readFileSync(jsonLogPath, 'utf8');
                const jsonLog = JSON.parse(jsonLogContent);
                reject(new Error(`JSON_LOG_CONTENT:${JSON.stringify(jsonLog, null, 2)}`));
              } catch (jsonError) {
                reject(new Error(`Failed to restore backup: ${fullOutput}`));
              }
            } else {
              reject(new Error(`Failed to restore backup: ${fullOutput}`));
            }
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }
} 
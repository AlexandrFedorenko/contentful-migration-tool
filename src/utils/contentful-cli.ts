import { spawn } from 'cross-spawn';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Путь к локальному исполняемому файлу contentful
const contentfulPath = path.join(process.cwd(), 'node_modules', '.bin', 'contentful');

/**
 * Утилита для работы с Contentful CLI
 */
export class ContentfulCLI {
  /**
   * Получает URL для авторизации через браузер
   */
  static async getAuthUrl(): Promise<{ browser_url: string }> {
    try {
      // Вместо запуска CLI, создаем URL напрямую
      // Используем официальный client_id из Contentful CLI
      const clientId = '9f86a1d54f3d6f85c159468f5919d6e5d27716b3ed68fd01bd534e3dea2df864';
      const redirectUri = 'https://www.contentful.com/developers/cli-oauth-page/';
      const scope = 'content_management_manage';
      
      // Формируем URL для авторизации
      const authUrl = `https://be.contentful.com/oauth/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
      
      console.log('Generated auth URL:', authUrl);
      
      return { browser_url: authUrl };
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }
  
  /**
   * Сохраняет токен в конфигурации Contentful CLI
   */
  static async saveToken(token: string): Promise<boolean> {
    try {
      console.log('Saving token to Contentful CLI config...');
      
      const cliProcess = spawn('contentful', ['config', 'add', '--management-token', token], { 
        stdio: 'pipe',
        shell: true
      });
      
      return new Promise((resolve, reject) => {
        cliProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log('Token saved successfully');
            resolve(true);
          } else {
            console.error('Failed to save token, exit code:', code);
            reject(new Error(`Failed to save token, exit code: ${code}`));
          }
        });
        
        cliProcess.stderr.on('data', (data: Buffer) => {
          console.error('Error saving token:', data.toString());
        });
      });
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }
  
  /**
   * Проверяет статус авторизации
   */
  static async checkAuthStatus(): Promise<{ loggedIn: boolean; config?: string }> {
    try {
      console.log('Checking Contentful CLI auth status...');
      
      // Проверяем наличие токена в переменных окружения
      const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
      if (token) {
        console.log('Token found in environment variables');
        return { 
          loggedIn: true,
          config: `managementToken: ${token.substring(0, 5)}...`
        };
      }
      
      // Проверяем конфигурацию CLI
      const checkProcess = spawn('contentful', ['config', 'list'], { 
        stdio: 'pipe',
        shell: true
      });
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        checkProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        checkProcess.on('close', (code: number) => {
          if (code === 0) {
            const isLoggedIn = output.includes('managementToken');
            
            // Если токен найден, сохраняем его в переменных окружения
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
            console.error('Failed to check auth status, exit code:', code);
            resolve({ loggedIn: false });
          }
        });
        
        // Устанавливаем таймаут
        setTimeout(() => {
          checkProcess.kill();
          console.log('Timeout checking auth status');
          resolve({ loggedIn: false });
        }, 5000);
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { loggedIn: false };
    }
  }
  
  /**
   * Проверка наличия Contentful CLI
   */
  static isContentfulCliAvailable(): boolean {
    try {
      // Проверяем локальную установку
      const localPath = path.join(process.cwd(), 'node_modules', '.bin', 'contentful');
      if (existsSync(localPath)) {
        return true;
      }
      
      // Проверяем глобальную установку (только для Linux/Mac)
      if (process.platform !== 'win32') {
        const result = spawn.sync('which', ['contentful'], { stdio: 'pipe' });
        return result.status === 0;
      }
      
      // Для Windows
      const result = spawn.sync('where', ['contentful'], { stdio: 'pipe', shell: true });
      return result.status === 0;
    } catch (error) {
      console.error('Error checking for Contentful CLI:', error);
      return false;
    }
  }
  
  /**
   * Выход из Contentful CLI
   */
  static async logout(): Promise<boolean> {
    console.log('Logging out from Contentful CLI...');
    
    // Удаляем токен из переменных окружения
    if (process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      delete process.env.CONTENTFUL_MANAGEMENT_TOKEN;
      console.log('Removed token from environment variables');
    }
    
    // Удаляем файл конфигурации - это самый надежный способ
    const configRemoved = await this.removeConfigFile();
    
    // Очищаем кэш авторизации
    try {
      const authCachePath = path.join(process.cwd(), '.auth-cache.json');
      if (fs.existsSync(authCachePath)) {
        fs.unlinkSync(authCachePath);
        console.log('Auth cache file removed');
      }
    } catch (error) {
      console.error('Error removing auth cache file:', error);
    }
    
    return configRemoved;
  }
  
  /**
   * Удаление файла конфигурации Contentful
   */
  private static async removeConfigFile(): Promise<boolean> {
    try {
      // Путь к файлу конфигурации Contentful
      const configPath = path.join(os.homedir(), '.contentfulrc.json');
      
      // Проверяем существование файла
      if (fs.existsSync(configPath)) {
        // Удаляем файл
        fs.unlinkSync(configPath);
        console.log('Contentful config file removed successfully');
        return true;
      } else {
        console.log('Contentful config file not found, considering logout successful');
        return true;
      }
    } catch (error) {
      console.error('Error removing Contentful config:', error);
      return false;
    }
  }
  
  /**
   * Создает бэкап пространства и окружения
   */
  static async createBackup(spaceId: string, environmentId: string, spaceName?: string): Promise<{ success: boolean; backupFile?: string }> {
    try {
      console.log(`Creating backup for space ${spaceId} (${spaceName || spaceId}), environment ${environmentId}...`);
      
      // Создаем директорию для бэкапов
      const backupDir = path.join(process.cwd(), 'backups', spaceId);
      fs.mkdirSync(backupDir, { recursive: true });
      
      // Генерируем имя файла с временной меткой
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const safeSpaceName = (spaceName || spaceId).replace(/[^a-zA-Z0-9-_]/g, '_'); // Заменяем спецсимволы на подчеркивания
      const backupFile = path.join(backupDir, `backup-${safeSpaceName}-${environmentId}-${timestamp}.json`);
      
      // Команда для экспорта
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
      
      // Автоматически отвечаем "yes" на все вопросы
      exportProcess.stdin.write('y\ny\ny\ny\ny\n');
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        exportProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
          console.log('Backup output:', data.toString());
        });
        
        exportProcess.stderr.on('data', (data: Buffer) => {
          console.error('Backup error:', data.toString());
        });
        
        exportProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log('Backup created successfully');
            resolve({
              success: true,
              backupFile: path.basename(backupFile)
            });
          } else {
            console.error('Failed to create backup, exit code:', code);
            reject(new Error(`Failed to create backup: ${output}`));
          }
        });
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
  
  /**
   * Восстанавливает бэкап в указанное окружение
   */
  static async restoreBackup(spaceId: string, fileName: string, targetEnvironment: string): Promise<boolean> {
    try {
      console.log(`Restoring backup ${fileName} to space ${spaceId}, environment ${targetEnvironment}...`);
      
      // Полный путь к файлу бэкапа
      const backupFile = path.join(process.cwd(), 'backups', spaceId, fileName);
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }
      
      // Команда для импорта
      const importProcess = spawn('contentful', [
        'space', 'import',
        '--space-id', spaceId,
        '--environment-id', targetEnvironment,
        '--content-file', backupFile
      ], { 
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      // Автоматически отвечаем "yes" на все вопросы
      importProcess.stdin.write('y\ny\ny\ny\ny\n');
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        importProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
          console.log('Restore output:', data.toString());
        });
        
        importProcess.stderr.on('data', (data: Buffer) => {
          console.error('Restore error:', data.toString());
        });
        
        importProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log('Backup restored successfully');
            resolve(true);
          } else {
            console.error('Failed to restore backup, exit code:', code);
            reject(new Error(`Failed to restore backup: ${output}`));
          }
        });
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }
} 
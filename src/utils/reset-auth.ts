import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Полная очистка состояния авторизации Contentful
 */
export const resetContentfulAuth = async (): Promise<boolean> => {
  try {
    // 1. Удаляем файл конфигурации Contentful
    const configPath = path.join(os.homedir(), '.contentfulrc.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('Contentful config file removed');
    }
    
    // 2. Удаляем файл кэша авторизации
    const cachePath = path.join(process.cwd(), '.auth-cache.json');
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      console.log('Auth cache file removed');
    }
    
    // 3. Очищаем переменную окружения
    if (process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      delete process.env.CONTENTFUL_MANAGEMENT_TOKEN;
      console.log('Environment variable cleared');
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting Contentful auth:', error);
    return false;
  }
}; 
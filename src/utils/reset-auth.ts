import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const resetContentfulAuth = async (): Promise<boolean> => {
  try {
    const configPath = path.join(os.homedir(), '.contentfulrc.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    const cachePath = path.join(process.cwd(), '.auth-cache.json');
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
    
    if (process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      delete process.env.CONTENTFUL_MANAGEMENT_TOKEN;
    }
    
    return true;
  } catch {
    return false;
  }
}; 
import * as fs from 'fs';
import * as path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.auth-cache.json');

export interface AuthCacheData {
  status: unknown;
  timestamp: number;
}

export const authCache = {
  get(): AuthCacheData {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        return data;
      }
    } catch {
    }
    return { status: null, timestamp: 0 };
  },
  
  set(data: AuthCacheData): void {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
    } catch {
    }
  },
  
  reset(): void {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }
    } catch {
    }
  }
}; 
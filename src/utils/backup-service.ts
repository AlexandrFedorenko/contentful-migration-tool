import * as fs from 'fs';
import * as path from 'path';
import { Backup } from '@/types/backup';

export class BackupService {
  static async getBackups(spaceId: string): Promise<Backup[]> {
    try {
      const backupDir = path.join(process.cwd(), 'backups', spaceId);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        return [];
      }
      
      const files = fs.readdirSync(backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const backups: Backup[] = backupFiles.map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          time: stats.mtime.getTime()
        };
      });
      
      return backups.sort((a, b) => b.time - a.time);
    } catch {
      return [];
    }
  }
  
  static async deleteBackup(spaceId: string, fileName: string): Promise<boolean> {
    const filePath = path.join(process.cwd(), 'backups', spaceId, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${filePath}`);
    }
    
    fs.unlinkSync(filePath);
    return true;
  }
} 
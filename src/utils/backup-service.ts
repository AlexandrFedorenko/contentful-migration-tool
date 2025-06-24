import * as fs from 'fs';
import * as path from 'path';
import { Backup } from '@/types/backup';

/**
 * Сервис для работы с бэкапами
 */
export class BackupService {
  /**
   * Получает список бэкапов для пространства
   */
  static async getBackups(spaceId: string): Promise<Backup[]> {
    try {
      const backupDir = path.join(process.cwd(), 'backups', spaceId);
      
      // Создаем директорию, если она не существует
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        return [];
      }
      
      // Получаем список файлов
      const files = fs.readdirSync(backupDir);
      
      // Фильтруем только JSON-файлы
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      // Формируем список бэкапов
      const backups: Backup[] = backupFiles.map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          time: stats.mtime.getTime()
        };
      });
      
      // Сортируем по времени (сначала новые)
      return backups.sort((a, b) => b.time - a.time);
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }
  
  /**
   * Удаляет бэкап
   */
  static async deleteBackup(spaceId: string, fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), 'backups', spaceId, fileName);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Backup file not found: ${filePath}`);
      }
      
      // Удаляем файл
      fs.unlinkSync(filePath);
      
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }
} 
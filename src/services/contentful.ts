import { fetchApi } from '@/utils/api';
import { 
  SpacesResponse, 
  EnvironmentsResponse, 
  BackupResponse 
} from '@/types/api';

export const contentfulService = {
  async getSpaces() {
    return fetchApi<SpacesResponse>('/api/spaces');
  },

  async getEnvironments(spaceId: string) {
    return fetchApi<EnvironmentsResponse>(`/api/environments?spaceId=${spaceId}`);
  },

  async createBackup(spaceId: string, env: string) {
    return fetchApi<BackupResponse>('/api/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        spaceId, 
        env 
      }),
    });
  },

  async restoreBackup(spaceId: string, backupFile: string, targetEnvId: string) {
    return fetchApi<BackupResponse>('/api/restore', {
      method: 'POST',
      body: JSON.stringify({ spaceId, backupFile, targetEnvId }),
    });
  },
}; 
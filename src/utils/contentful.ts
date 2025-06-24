import { createClient } from 'contentful-management';
import { fetchApi } from './api';
import { Backup } from '@/types/backup';

interface BackupResponse {
  success: boolean;
  backupFile: string;
}

interface BackupRequest {
  spaceId: string;
  environmentId: string;
}

const getManagementClient = () => {
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  if (!accessToken) {
    throw new Error('Contentful management token not configured');
  }
  return createClient({ accessToken });
};

export const contentfulService = {
  getSpaces: async () => {
    const client = getManagementClient();
    const spaces = await client.getSpaces();
    return spaces.items.map(space => ({
      id: space.sys.id,
      name: space.name
    }));
  },

  getEnvironments: async (spaceId: string) => {
    const client = getManagementClient();
    const space = await client.getSpace(spaceId);
    const environments = await space.getEnvironments();
    return environments.items.map(env => ({
      id: env.sys.id,
      name: env.name || env.sys.id
    }));
  },

  createBackup: async (spaceId: string, environmentId: string): Promise<BackupResponse> => {
    const payload: BackupRequest = {
      spaceId,
      environmentId
    };

    console.log("Sending backup request:", payload);

    return await fetchApi<BackupResponse>('/api/backup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getBackups: async (spaceId: string) => {
    const response = await fetchApi<{ backups: Backup[] }>(`/api/backups?spaceId=${spaceId}`);
    return response.backups || [];
  }
}; 
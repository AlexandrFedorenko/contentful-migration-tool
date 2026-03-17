/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, ClientAPI, Environment as CMAEnvironment } from 'contentful-management';
import { Environment, Space } from '@/types/common';
import { BackupData } from '@/types/backup';

interface ContentfulSpace {
  sys: { id: string };
  name: string;
}

interface ContentfulEnvironment {
  sys: {
    id: string;
    createdAt?: string;
  };
  name: string;
}

export interface ContentTypeField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  localized?: boolean;
  disabled?: boolean;
  omitted?: boolean;
  validations?: unknown[];
  items?: unknown;
  linkType?: string;
}

export interface ContentType {
  sys: {
    id: string;
    type: string;
    version: number;
    publishedVersion?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  name: string;
  description?: string;
  displayField?: string;
  fields: ContentTypeField[];
  [key: string]: any;
}

export interface Entry {
  sys: {
    id: string;
    type?: string;
    contentType: { sys: { id: string } };
    version?: number;
    publishedVersion?: number;
    archivedVersion?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  fields: Record<string, unknown>;
  [key: string]: any;
}

export interface Asset {
  sys: {
    id: string;
    type?: string;
    version?: number;
    publishedVersion?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  fields: Record<string, unknown>;
  [key: string]: any;
}

export class ContentfulManagement {
  public static getClient(token: string, host?: string): ClientAPI {
    if (!token) throw new Error('Contentful Management Token required');
    return createClient({
      accessToken: token,
      host: host || 'api.contentful.com'
    });
  }

  private static async getEnvironment(spaceId: string, environmentId: string, token: string): Promise<CMAEnvironment> {
    const client = this.getClient(token);
    const space = await client.getSpace(spaceId);
    return space.getEnvironment(environmentId);
  }

  private static async fetchAll<T>(
    fetchFn: (query: { limit: number; skip: number }) => Promise<{ items: T[] }>,
    limit = 1000
  ): Promise<T[]> {
    const allItems: T[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchFn({ limit, skip });
      allItems.push(...response.items);
      hasMore = response.items.length === limit;
      skip += limit;
    }
    return allItems;
  }

  static async getSpaces(token: string): Promise<Space[]> {
    try {
      const client = this.getClient(token);
      const response = await client.getSpaces();
      return response.items.map((space: ContentfulSpace) => ({
        id: space.sys.id,
        name: space.name
      }));
    } catch (error) {
      console.error(`[Management API] getSpaces Error:`, error);
      throw error;
    }
  }

  static async getEnvironments(spaceId: string, token: string): Promise<Environment[]> {
    const client = this.getClient(token);
    const space = await client.getSpace(spaceId);
    const response = await space.getEnvironments();

    return response.items.map((env: ContentfulEnvironment) => ({
      id: env.sys.id,
      name: env.name,
      createdAt: env.sys.createdAt
    }));
  }

  static async getSpace(spaceId: string, token: string): Promise<Space | null> {
    try {
      const client = this.getClient(token);
      const space = await client.getSpace(spaceId);
      return { id: space.sys.id, name: space.name };
    } catch {
      return null;
    }
  }

  static async getContentTypes(spaceId: string, environmentId: string, token: string): Promise<ContentType[]> {
    const env = await this.getEnvironment(spaceId, environmentId, token);
    const items = await this.fetchAll(({ limit, skip }) => env.getContentTypes({ limit, skip }));

    return items.map(ct => ({
      sys: {
        id: ct.sys.id,
        type: ct.sys.type,
        version: ct.sys.version,
        publishedVersion: ct.sys.publishedVersion
      },
      name: ct.name,
      description: ct.description,
      displayField: ct.displayField,
      fields: ct.fields as ContentTypeField[]
    }));
  }

  static async getEntries(spaceId: string, environmentId: string, token: string): Promise<Entry[]> {
    const env = await this.getEnvironment(spaceId, environmentId, token);
    const items = await this.fetchAll(({ limit, skip }) => env.getEntries({ limit, skip }));

    return items.map(entry => ({
      sys: {
        id: entry.sys.id,
        contentType: { sys: { id: entry.sys.contentType.sys.id } },
        version: entry.sys.version,
        publishedVersion: entry.sys.publishedVersion,
        archivedVersion: entry.sys.archivedVersion
      },
      fields: entry.fields as Record<string, unknown>
    }));
  }

  static async *getEntriesIterator(
    spaceId: string,
    environmentId: string,
    token: string,
    batchSize = 100
  ): AsyncGenerator<Entry[], void, unknown> {
    const env = await this.getEnvironment(spaceId, environmentId, token);
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await env.getEntries({ limit: batchSize, skip });
      const entries: Entry[] = response.items.map((entry) => ({
        sys: {
          id: entry.sys.id,
          contentType: { sys: { id: entry.sys.contentType.sys.id } },
          version: entry.sys.version,
          publishedVersion: entry.sys.publishedVersion,
          archivedVersion: entry.sys.archivedVersion,
          updatedAt: entry.sys.updatedAt
        },
        fields: entry.fields as Record<string, unknown>
      }));

      if (entries.length > 0) yield entries;
      hasMore = response.items.length === batchSize;
      skip += batchSize;
    }
  }

  static async getLocales(spaceId: string, environmentId: string, token: string) {
    const env = await this.getEnvironment(spaceId, environmentId, token);
    const response = await env.getLocales();
    return response.items;
  }

  static async getAssets(spaceId: string, environmentId: string, token: string): Promise<Asset[]> {
    const env = await this.getEnvironment(spaceId, environmentId, token);
    const items = await this.fetchAll(({ limit, skip }) => env.getAssets({ limit, skip }));
    return items.map(asset => ({
      sys: {
        id: asset.sys.id,
        type: asset.sys.type,
        version: asset.sys.version,
        publishedVersion: asset.sys.publishedVersion,
        createdAt: asset.sys.createdAt,
        updatedAt: asset.sys.updatedAt
      },
      fields: asset.fields
    }));
  }

  static async getEntry(spaceId: string, environmentId: string, entryId: string, token: string): Promise<Entry | null> {
    try {
      const env = await this.getEnvironment(spaceId, environmentId, token);
      const entry = await env.getEntry(entryId);

      return {
        sys: {
          id: entry.sys.id,
          contentType: { sys: { id: entry.sys.contentType.sys.id } },
          version: entry.sys.version,
          publishedVersion: entry.sys.publishedVersion,
          archivedVersion: entry.sys.archivedVersion,
          updatedAt: entry.sys.updatedAt
        },
        fields: entry.fields as Record<string, unknown>
      };
    } catch (error) {
      console.error(`Error fetching entry ${entryId}:`, error);
      return null;
    }
  }

  static async publishEntry(spaceId: string, environmentId: string, entryId: string, token: string): Promise<void> {
    const env = await this.getEnvironment(spaceId, environmentId, token);
    const entry = await env.getEntry(entryId);
    await entry.publish();
  }

  /**
   * Creates a full backup using Management API (includes drafts)
   */
  static async createFullBackup(
    spaceId: string,
    environmentId: string,
    token: string,
    onLog?: (message: string) => void
  ): Promise<{ success: boolean; backupData?: BackupData; error?: string }> {
    try {
      onLog?.(`[Management API] Starting full backup for ${spaceId}/${environmentId}...`);
      const env = await this.getEnvironment(spaceId, environmentId, token);

      const [contentTypes, locales, entries, assets] = await Promise.all([
        this._fetchContentTypes(env, onLog),
        this._fetchLocales(env, onLog),
        this._fetchEntries(env, onLog),
        this._fetchAssets(env, onLog)
      ]);

      const backupData: BackupData = {
        contentTypes,
        entries,
        assets,
        locales
      };

      onLog?.('[Management API] Backup completed successfully');
      return { success: true, backupData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onLog?.(`[Management API] Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private static async _fetchContentTypes(env: CMAEnvironment, onLog?: (m: string) => void): Promise<ContentType[]> {
    onLog?.('[Management API] Fetching content types...');
    const items = await this.fetchAll(({ limit, skip }) => env.getContentTypes({ limit, skip }));
    onLog?.(`[Management API] Found ${items.length} content types`);

    return items.map(ct => ({
      sys: {
        id: ct.sys.id,
        type: ct.sys.type as any,
        version: ct.sys.version,
        publishedVersion: ct.sys.publishedVersion,
        createdAt: ct.sys.createdAt,
        updatedAt: ct.sys.updatedAt
      },
      name: ct.name,
      description: ct.description,
      displayField: ct.displayField,
      fields: ct.fields as any[]
    }));
  }

  private static async _fetchLocales(env: CMAEnvironment, onLog?: (m: string) => void) {
    onLog?.('[Management API] Fetching locales...');
    const response = await env.getLocales();
    onLog?.(`[Management API] Found ${response.items.length} locales`);

    return response.items.map(locale => ({
      code: locale.code,
      name: locale.name,
      default: locale.default,
      fallbackCode: locale.fallbackCode
    }));
  }

  private static async _fetchEntries(env: CMAEnvironment, onLog?: (m: string) => void): Promise<Entry[]> {
    onLog?.('[Management API] Fetching entries (including drafts)...');
    const items = await this.fetchAll(({ limit, skip }) => env.getEntries({ limit, skip }), 1000);
    onLog?.(`[Management API] Total entries fetched: ${items.length}`);

    return items.map(entry => ({
      sys: {
        id: entry.sys.id,
        type: entry.sys.type,
        contentType: entry.sys.contentType,
        version: entry.sys.version,
        publishedVersion: entry.sys.publishedVersion,
        createdAt: entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt
      },
      fields: entry.fields
    }));
  }

  private static async _fetchAssets(env: CMAEnvironment, onLog?: (m: string) => void) {
    onLog?.('[Management API] Fetching assets...');
    const items = await this.fetchAll(({ limit, skip }) => env.getAssets({ limit, skip }));
    onLog?.(`[Management API] Found ${items.length} assets`);

    return items.map(asset => ({
      sys: {
        id: asset.sys.id,
        type: asset.sys.type,
        version: asset.sys.version,
        publishedVersion: asset.sys.publishedVersion,
        createdAt: asset.sys.createdAt,
        updatedAt: asset.sys.updatedAt
      },
      fields: asset.fields
    }));
  }

  /**
   * Delete all entities of a specific type from an environment
   * Used for clearing environment before restore/migration
   */
  static async deleteAllEntities(
    environment: CMAEnvironment,
    type: 'Entry' | 'Asset' | 'ContentType',
    options?: { rateLimitDelayMs?: number; maxStuckCount?: number }
  ): Promise<void> {
    const { rateLimitDelayMs = 1000, maxStuckCount = 5 } = options || {};
    let hasItems = true;
    let skip = 0;
    let stuckCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getItems = async (): Promise<{ items: any[]; total: number }> => {
      if (type === 'Entry') return environment.getEntries({ limit: 100, skip });
      if (type === 'Asset') return environment.getAssets({ limit: 100, skip });
      return environment.getContentTypes({ limit: 100, skip });
    };

    while (hasItems && stuckCount < maxStuckCount) {
      const result = await getItems();

      if (!result?.items?.length) {
        hasItems = false;
        break;
      }

      let deletedInThisBatch = 0;

      for (const item of result.items) {
        try {
          if (item.isPublished) await item.unpublish();
        } catch {
          // Ignore unpublish errors
        }
        try {
          await item.delete();
          deletedInThisBatch++;
        } catch {
          // Ignore delete errors
        }
      }

      if (deletedInThisBatch === 0 && result.items.length > 0) {
        skip += result.items.length;
        stuckCount++;
      } else {
        stuckCount = 0;
        skip = 0;
      }

      await new Promise(r => setTimeout(r, rateLimitDelayMs));
    }
  }
}

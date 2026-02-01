import { createClient, ClientAPI } from 'contentful-management';
import { Environment, Space } from '@/types/common';

interface ContentfulSpace {
  sys: {
    id: string;
  };
  name: string;
}

interface ContentfulEnvironment {
  sys: {
    id: string;
    createdAt?: string;
  };
  name: string;
}

interface ContentTypeField {
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

interface ContentType {
  sys: {
    id: string;
    type: string;
    version: number;
    publishedVersion?: number;
  };
  name: string;
  description?: string;
  displayField?: string;
  fields: ContentTypeField[];
}

interface Entry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    version?: number;
    publishedVersion?: number;
    archivedVersion?: number;
    updatedAt?: string;
  };
  fields: Record<string, unknown>;
}

export class ContentfulManagement {
  private static client: ClientAPI | null = null;

  public static getClient(): ClientAPI {
    if (!this.client) {
      const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
      if (!token) {
        throw new Error('Contentful Management Token not found');
      }

      this.client = createClient({
        accessToken: token
      });
    }

    return this.client;
  }

  static async getSpaces(): Promise<Space[]> {
    try {
      const client = this.getClient();
      const response = await client.getSpaces();

      return response.items.map((space: ContentfulSpace) => ({
        id: space.sys.id,
        name: space.name
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getEnvironments(spaceId: string): Promise<Environment[]> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const response = await space.getEnvironments();

      return response.items.map((env: ContentfulEnvironment) => ({
        id: env.sys.id,
        name: env.name,
        createdAt: env.sys.createdAt
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getSpace(spaceId: string): Promise<Space | null> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);

      return {
        id: space.sys.id,
        name: space.name
      };
    } catch {
      return null;
    }
  }

  static async getContentTypes(spaceId: string, environmentId: string): Promise<ContentType[]> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);

      const allContentTypes: ContentType[] = [];
      let skip = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await environment.getContentTypes({ limit, skip });

        const contentTypes = response.items.map((contentType) => ({
          sys: {
            id: contentType.sys.id,
            type: contentType.sys.type,
            version: contentType.sys.version,
            publishedVersion: contentType.sys.publishedVersion
          },
          name: contentType.name,
          description: contentType.description,
          displayField: contentType.displayField,
          fields: contentType.fields as ContentTypeField[]
        }));

        allContentTypes.push(...contentTypes);

        hasMore = response.items.length === limit;
        skip += limit;
      }

      return allContentTypes;
    } catch (error) {
      throw error;
    }
  }

  static async getEntries(spaceId: string, environmentId: string): Promise<Entry[]> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);

      const allEntries: Entry[] = [];
      let skip = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await environment.getEntries({ limit, skip });

        const entries = response.items.map((entry) => ({
          sys: {
            id: entry.sys.id,
            contentType: {
              sys: {
                id: entry.sys.contentType.sys.id
              }
            },
            version: entry.sys.version,
            publishedVersion: entry.sys.publishedVersion,
            archivedVersion: entry.sys.archivedVersion
          },
          fields: entry.fields as Record<string, unknown>
        }));

        allEntries.push(...entries);

        hasMore = response.items.length === limit;
        skip += limit;
      }

      return allEntries;
    } catch (error) {
      throw error;
    }
  }

  static async *getEntriesIterator(spaceId: string, environmentId: string, batchSize = 100): AsyncGenerator<Entry[], void, unknown> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);

      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await environment.getEntries({ limit: batchSize, skip });

        const entries = response.items.map((entry) => ({
          sys: {
            id: entry.sys.id,
            contentType: {
              sys: {
                id: entry.sys.contentType.sys.id
              }
            },
            version: entry.sys.version,
            publishedVersion: entry.sys.publishedVersion,
            archivedVersion: entry.sys.archivedVersion,
            updatedAt: entry.sys.updatedAt
          },
          fields: entry.fields as Record<string, unknown>
        }));

        if (entries.length > 0) {
          yield entries;
        }

        hasMore = response.items.length === batchSize;
        skip += batchSize;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getLocales(spaceId: string, environmentId: string): Promise<any[]> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);
      const response = await environment.getLocales();
      return response.items;
    } catch (error) {
      throw error;
    }
  }

  static async getEntry(spaceId: string, environmentId: string, entryId: string): Promise<Entry | null> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);

      const entry = await environment.getEntry(entryId);

      return {
        sys: {
          id: entry.sys.id,
          contentType: {
            sys: {
              id: entry.sys.contentType.sys.id
            }
          },
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

  static async publishEntry(spaceId: string, environmentId: string, entryId: string): Promise<void> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);
      const entry = await environment.getEntry(entryId);
      await entry.publish();
    } catch (error) {
      console.error(`Error publishing entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a full backup using Management API (includes drafts)
   * This is different from CLI export which only exports published content
   */
  static async createFullBackup(
    spaceId: string,
    environmentId: string,
    onLog?: (message: string) => void
  ): Promise<{ success: boolean; backupData?: any; error?: string }> {
    try {
      onLog?.(`[Management API] Starting full backup for ${spaceId}/${environmentId}...`);

      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);

      // Get all content types
      onLog?.('[Management API] Fetching content types...');
      const contentTypesResponse = await environment.getContentTypes({ limit: 1000 });
      const contentTypes = contentTypesResponse.items;
      onLog?.(`[Management API] Found ${contentTypes.length} content types`);

      // Get all locales
      onLog?.('[Management API] Fetching locales...');
      const localesResponse = await environment.getLocales();
      const locales = localesResponse.items;
      onLog?.(`[Management API] Found ${locales.length} locales`);

      // Get all entries (including drafts)
      onLog?.('[Management API] Fetching entries (including drafts)...');
      const allEntries: any[] = [];
      let skip = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const entriesResponse = await environment.getEntries({ limit, skip });
        allEntries.push(...entriesResponse.items);
        hasMore = entriesResponse.items.length === limit;
        skip += limit;
        onLog?.(`[Management API] Fetched ${allEntries.length} entries so far...`);
      }
      onLog?.(`[Management API] Total entries fetched: ${allEntries.length}`);

      onLog?.('[Management API] Fetching assets...');
      const allAssets: any[] = [];
      skip = 0;
      hasMore = true;

      while (hasMore) {
        const assetsResponse = await environment.getAssets({ limit, skip });
        allAssets.push(...assetsResponse.items);
        hasMore = assetsResponse.items.length === limit;
        skip += limit;
      }
      onLog?.(`[Management API] Found ${allAssets.length} assets`);

      // Build backup data structure (compatible with CLI export format)
      const backupData = {
        contentTypes: contentTypes.map(ct => ({
          sys: {
            id: ct.sys.id,
            type: ct.sys.type,
            version: ct.sys.version,
            publishedVersion: ct.sys.publishedVersion,
            createdAt: ct.sys.createdAt,
            updatedAt: ct.sys.updatedAt
          },
          name: ct.name,
          description: ct.description,
          displayField: ct.displayField,
          fields: ct.fields
        })),
        entries: allEntries.map(entry => ({
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
        })),
        assets: allAssets.map(asset => ({
          sys: {
            id: asset.sys.id,
            type: asset.sys.type,
            version: asset.sys.version,
            publishedVersion: asset.sys.publishedVersion,
            createdAt: asset.sys.createdAt,
            updatedAt: asset.sys.updatedAt
          },
          fields: asset.fields
        })),
        locales: locales.map(locale => ({
          code: locale.code,
          name: locale.name,
          default: locale.default,
          fallbackCode: locale.fallbackCode
        }))
      };

      onLog?.('[Management API] Backup completed successfully');
      return { success: true, backupData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onLog?.(`[Management API] Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
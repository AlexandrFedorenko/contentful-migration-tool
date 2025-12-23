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
  };
  fields: Record<string, unknown>;
}

export class ContentfulManagement {
  private static client: ClientAPI | null = null;
  
  private static getClient(): ClientAPI {
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
} 
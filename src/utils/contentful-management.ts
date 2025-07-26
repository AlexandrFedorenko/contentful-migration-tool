import { createClient } from 'contentful-management';
import { Environment, Space } from '@/types/common';

// Добавьте интерфейс для объекта space из Contentful API
interface ContentfulSpace {
  sys: {
    id: string;
  };
  name: string;
}

// Добавьте интерфейс для объекта environment из Contentful API
interface ContentfulEnvironment {
  sys: {
    id: string;
    createdAt?: string;
  };
  name: string;
}

/**
 * Класс для работы с Contentful Management API
 */
export class ContentfulManagement {
  private static client: any = null;
  
  /**
   * Получает клиент Contentful Management API
   */
  private static getClient() {
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
  
  /**
   * Получает список пространств
   */
  static async getSpaces(): Promise<Space[]> {
    try {
      const client = this.getClient();
      const response = await client.getSpaces();
      
      return response.items.map((space: ContentfulSpace) => ({
        id: space.sys.id,
        name: space.name
      }));
    } catch (error) {
      console.error('Error getting spaces:', error);
      throw error;
    }
  }
  
  /**
   * Получает список окружений для пространства
   */
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
      console.error('Error getting environments:', error);
      throw error;
    }
  }
  
  /**
   * Выполняет миграцию контента между окружениями
   */
  static async migrateContent(
    spaceId: string, 
    sourceEnvironment: string, 
    targetEnvironment: string,
    useAdvanced: boolean = false
  ): Promise<boolean> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      
      // Получаем исходное окружение
      const sourceEnv = await space.getEnvironment(sourceEnvironment);
      
      // Получаем целевое окружение
      const targetEnv = await space.getEnvironment(targetEnvironment);
      
      // Получаем все типы контента
      const contentTypes = await sourceEnv.getContentTypes({ limit: 1000 });
      
      // Получаем все записи
      const entries = await sourceEnv.getEntries({ limit: 1000 });
      
      // Получаем все ассеты
      const assets = await sourceEnv.getAssets({ limit: 1000 });
      
      // Обрабатываем типы контента
      for (const contentType of contentTypes.items) {
        try {
          // Проверяем, существует ли тип контента в целевом окружении
          let targetContentType;
          try {
            targetContentType = await targetEnv.getContentType(contentType.sys.id);
          } catch (error) {
            // Если тип контента не существует, создаем его
            targetContentType = await targetEnv.createContentTypeWithId(
              contentType.sys.id,
              {
                name: contentType.name,
                description: contentType.description,
                displayField: contentType.displayField,
                fields: contentType.fields
              }
            );
          }
          
          // Обновляем тип контента
          targetContentType.name = contentType.name;
          targetContentType.description = contentType.description;
          targetContentType.displayField = contentType.displayField;
          targetContentType.fields = contentType.fields;
          
          await targetContentType.update();
          
          // Публикуем тип контента
          if (contentType.sys.publishedVersion) {
            await targetContentType.publish();
          }
        } catch (error) {
          console.error(`Error processing content type ${contentType.sys.id}:`, error);
        }
      }
      
      // Обрабатываем ассеты
      for (const asset of assets.items) {
        try {
          // Проверяем, существует ли ассет в целевом окружении
          let targetAsset;
          try {
            targetAsset = await targetEnv.getAsset(asset.sys.id);
          } catch (error) {
            // Если ассет не существует, создаем его
            targetAsset = await targetEnv.createAssetWithId(
              asset.sys.id,
              {
                fields: asset.fields
              }
            );
          }
          
          // Обновляем ассет
          targetAsset.fields = asset.fields;
          await targetAsset.update();
          
          // Обрабатываем ассет
          await targetAsset.processForAllLocales();
          
          // Публикуем ассет
          if (asset.sys.publishedVersion) {
            await targetAsset.publish();
          }
          
          // Архивируем ассет, если он архивирован в исходном окружении
          if (asset.sys.archivedVersion) {
            await targetAsset.archive();
          }
        } catch (error) {
          console.error(`Error processing asset ${asset.sys.id}:`, error);
        }
      }
      
      // Обрабатываем записи
      for (const entry of entries.items) {
        try {
          // Проверяем, существует ли запись в целевом окружении
          let targetEntry;
          try {
            targetEntry = await targetEnv.getEntry(entry.sys.id);
          } catch (error) {
            // Если запись не существует, создаем ее
            targetEntry = await targetEnv.createEntryWithId(
              entry.sys.contentType.sys.id,
              entry.sys.id,
              {
                fields: entry.fields
              }
            );
          }
          
          // Обновляем запись
          targetEntry.fields = entry.fields;
          await targetEntry.update();
          
          // Публикуем запись
          if (entry.sys.publishedVersion) {
            await targetEntry.publish();
          }
          
          // Архивируем запись, если она архивирована в исходном окружении
          if (entry.sys.archivedVersion) {
            await targetEntry.archive();
          }
        } catch (error) {
          console.error(`Error processing entry ${entry.sys.id}:`, error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error migrating content:', error);
      throw error;
    }
  }

  /**
   * Получает информацию о конкретном пространстве по ID
   */
  static async getSpace(spaceId: string): Promise<Space | null> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      
      return {
        id: space.sys.id,
        name: space.name
      };
    } catch (error) {
      console.error('Error getting space:', error);
      return null;
    }
  }

  /**
   * Получает список content types для окружения
   */
  static async getContentTypes(spaceId: string, environmentId: string): Promise<any[]> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);
      const response = await environment.getContentTypes({ limit: 1000 });
      
      return response.items.map((contentType: any) => ({
        sys: {
          id: contentType.sys.id,
          type: contentType.sys.type,
          version: contentType.sys.version
        },
        name: contentType.name,
        description: contentType.description,
        displayField: contentType.displayField,
        fields: contentType.fields
      }));
    } catch (error) {
      console.error('Error getting content types:', error);
      throw error;
    }
  }

  /**
   * Получает список entries для окружения
   */
  static async getEntries(spaceId: string, environmentId: string): Promise<any[]> {
    try {
      const client = this.getClient();
      const space = await client.getSpace(spaceId);
      const environment = await space.getEnvironment(environmentId);
      const response = await environment.getEntries({ limit: 1000 });
      
      return response.items.map((entry: any) => ({
        sys: {
          id: entry.sys.id,
          contentType: {
            sys: {
              id: entry.sys.contentType.sys.id
            }
          }
        },
        fields: entry.fields
      }));
    } catch (error) {
      console.error('Error getting entries:', error);
      throw error;
    }
  }
} 
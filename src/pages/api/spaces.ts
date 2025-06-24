import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from 'contentful-management';

type ResponseData = {
  success: boolean;
  message?: string;
  spaces?: any[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Проверяем наличие токена
    const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login first.'
      });
    }
    
    // Создаем клиент Contentful
    const client = createClient({
      accessToken: token
    });
    
    // Получаем список пространств
    const spacesCollection = await client.getSpaces();
    const spaces = spacesCollection.items.map(space => ({
      sys: {
        id: space.sys.id
      },
      name: space.name
    }));
    
    return res.status(200).json({
      success: true,
      spaces
    });
  } catch (error) {
    console.error('Error loading spaces:', error);
    
    // Проверяем, связана ли ошибка с авторизацией
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('401') || errorMessage.includes('unauthorized') 
      ? 401 
      : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: `Error loading spaces: ${errorMessage}`
    });
  }
}

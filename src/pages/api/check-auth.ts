import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulCLI } from '@/utils/contentful-cli';

interface CheckAuthResponse {
  logged_in: boolean;
  config?: string;
  error?: string;
}

// Вместо прямого экспорта переменной
let _authCache: {
  status: CheckAuthResponse | null;
  timestamp: number;
} = {
  status: null,
  timestamp: 0
};

// Экспортируем объект с геттерами и сеттерами
export const authCache = {
  get status() { 
    return _authCache.status; 
  },
  set status(value) { 
    _authCache.status = value; 
  },
  get timestamp() { 
    return _authCache.timestamp; 
  },
  set timestamp(value) { 
    _authCache.timestamp = value; 
  },
  // Метод для сброса кэша
  reset() {
    _authCache.status = null;
    _authCache.timestamp = 0;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckAuthResponse>
) {
  try {
    // Используем кэш, если он не старше 30 секунд
    const now = Date.now();
    if (authCache.status && now - authCache.timestamp < 30000) {
      console.log('Using cached auth status');
      return res.status(200).json(authCache.status);
    }

    // Проверяем статус авторизации
    const status = await ContentfulCLI.checkAuthStatus();
    
    // Обновляем кэш
    const result = {
      logged_in: status.loggedIn,
      config: status.config
    };
    
    authCache.status = result;
    authCache.timestamp = now;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Auth check error:', error);
    
    return res.status(500).json({ 
      logged_in: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 
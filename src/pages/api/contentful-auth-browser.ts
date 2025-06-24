import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';
import { authCache } from '@/utils/auth-cache';
import crypto from 'crypto';

interface ContentfulAuthBrowserResponse {
    success: boolean;
    message?: string;
    authUrl?: string;
    token?: string;
}

// Генерация случайного client_id
const generateClientId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Базовый URL для авторизации Contentful
const CONTENTFUL_AUTH_URL = 'https://be.contentful.com/oauth/authorize';

// Сбрасываем кэш авторизации при логине/логауте
const invalidateAuthCache = () => {
    // Импортируем динамически, чтобы избежать циклических зависимостей
    import('./check-auth').then(module => {
        if (module.authCache) {
            module.authCache.reset();
        }
    }).catch(err => console.error('Failed to invalidate auth cache:', err));
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ContentfulAuthBrowserResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { action, token } = req.body;

        if (action === 'getAuthUrl') {
            try {
                // Используем ContentfulCLI для получения URL авторизации
                const authUrlResult = await ContentfulCLI.getAuthUrl();
                
                if (!authUrlResult || !authUrlResult.browser_url) {
                    throw new Error('Failed to get auth URL from Contentful CLI');
                }
                
                console.log('Generated auth URL from CLI:', authUrlResult.browser_url);
                
                return res.status(200).json({
                    success: true,
                    authUrl: authUrlResult.browser_url
                });
            } catch (error) {
                console.error('Error getting auth URL from CLI:', error);
                return res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to get auth URL'
                });
            }
        } 
        else if (action === 'saveToken') {
            // Сохраняем токен
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }
            
            // Сохраняем токен в переменную окружения
            process.env.CONTENTFUL_MANAGEMENT_TOKEN = token;
            await ContentfulCLI.saveToken(token);
            // Сбрасываем кэш авторизации
            authCache.reset();
            
            return res.status(200).json({
                success: true,
                message: 'Token saved successfully'
            });
        } 
        else if (action === 'logout') {
            console.log('Processing logout request...');
            
            // Выполняем выход
            const success = await ContentfulCLI.logout();
            
            // Сбрасываем кэш авторизации
            authCache.reset();
            
            // Очищаем куки, если они используются
            res.setHeader('Set-Cookie', [
                'contentful_token=; Path=/; Max-Age=0',
                'contentful_logged_in=; Path=/; Max-Age=0'
            ]);
            
            return res.status(200).json({
                success: true,
                message: success 
                    ? 'Successfully logged out from Contentful' 
                    : 'Logout process may not have completed successfully, but cache was cleared'
            });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the request'
        });
    }
}
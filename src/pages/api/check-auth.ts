import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulCLI } from '@/utils/contentful-cli';

interface CheckAuthResponse {
  logged_in: boolean;
  config?: string;
  error?: string;
}

interface AuthCache {
  status: CheckAuthResponse | null;
  timestamp: number;
}

const CACHE_TTL = 30000;

let authCache: AuthCache = {
  status: null,
  timestamp: 0
};

export const resetAuthCache = (): void => {
  authCache.status = null;
  authCache.timestamp = 0;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckAuthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      logged_in: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const now = Date.now();
    if (authCache.status && now - authCache.timestamp < CACHE_TTL) {
      return res.status(200).json(authCache.status);
    }

    const status = await ContentfulCLI.checkAuthStatus();
    
    const result: CheckAuthResponse = {
      logged_in: status.loggedIn,
      config: status.config
    };
    
    authCache.status = result;
    authCache.timestamp = now;
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ 
      logged_in: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 
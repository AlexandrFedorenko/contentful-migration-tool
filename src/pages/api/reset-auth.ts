import type { NextApiRequest, NextApiResponse } from 'next';
import { resetContentfulAuth } from '@/utils/reset-auth';
import { authCache } from '@/utils/auth-cache';

interface ResetAuthResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResetAuthResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    await resetContentfulAuth();
    authCache.reset();
    
    res.setHeader('Set-Cookie', [
      'contentful_token=; Path=/; Max-Age=0',
      'contentful_logged_in=; Path=/; Max-Age=0'
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'Auth state has been completely reset'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
} 
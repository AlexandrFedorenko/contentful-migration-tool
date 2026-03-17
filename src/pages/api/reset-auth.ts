import type { NextApiRequest, NextApiResponse } from 'next';
import { resetContentfulAuth } from '@/utils/reset-auth';

interface ResetAuthResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResetAuthResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    await resetContentfulAuth();

    res.setHeader('Set-Cookie', [
      'contentful_token=; Path=/; Max-Age=0',
      'contentful_logged_in=; Path=/; Max-Age=0'
    ]);

    return res.status(200).json({
      success: true,
      data: { message: 'Auth state has been completely reset' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
} 
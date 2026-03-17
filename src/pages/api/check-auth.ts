import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from 'next';

interface CheckAuthResponse {
  success: boolean;
  data?: {
    logged_in: boolean;
    config?: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckAuthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(200).json({
        success: true,
        data: { logged_in: false }
      });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    const hasToken = !!user?.contentfulToken;

    return res.status(200).json({
      success: true,
      data: {
        logged_in: hasToken,
        config: hasToken ? 'User Profile Token' : undefined
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
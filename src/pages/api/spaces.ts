/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';
import { SpacesResponse } from '@/types/api';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpacesResponse>
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || !user.contentfulToken) {
      return res.status(401).json({ success: false, error: 'Contentful token not set in profile' });
    }

    const token = decrypt(user.contentfulToken);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    let client = ContentfulManagement.getClient(token);

    interface SpaceItem { id: string; name: string; }
    let spaces: SpaceItem[] = [];

    try {
      const spacesRes = await client.getSpaces();
      spaces = spacesRes.items.map((i: any) => ({ id: i.sys.id, name: i.name }));
    } catch {
      // Intentional catch - EU fallback below
    }

    if (spaces.length === 0) {
      try {
        const euClient = ContentfulManagement.getClient(token, 'api.eu.contentful.com');
        const euSpacesRes = await euClient.getSpaces();
        if (euSpacesRes.items.length > 0) {
          spaces = euSpacesRes.items.map((i: any) => ({ id: i.sys.id, name: i.name }));
          client = euClient;
        }
      } catch {
        // EU host attempt failed, continue with empty spaces
      }
    }

    return res.status(200).json({
      success: true,
      data: { spaces }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('401') || errorMessage.includes('unauthorized')
      ? 401
      : 500;

    return res.status(statusCode).json({
      success: false,
      error: `Error loading spaces: ${errorMessage}`
    });
  }
}

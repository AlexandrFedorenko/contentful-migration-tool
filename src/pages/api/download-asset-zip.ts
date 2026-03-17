import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { spaceId, fileName } = req.query;

    if (!spaceId || typeof spaceId !== 'string' || !fileName || typeof fileName !== 'string' || !userId || typeof userId !== 'string') {
        return res.status(400).json({ success: false, error: 'Space ID, fileName, and userId are required' });
    }

    // Reparsing for safety
    const sid = spaceId as string;
    const fname = fileName as string;

    const zipName = fname.replace('.json', '-with-assets.zip');
    const zipPath = path.join(process.cwd(), 'backups', sid, zipName);

    if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ success: false, error: 'Asset archive not found' });
    }

    try {
        const fileBuffer = fs.readFileSync(zipPath);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
        res.status(200).send(fileBuffer);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Download failed'
        });
    }
}

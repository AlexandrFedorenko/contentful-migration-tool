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

    if (!spaceId || typeof spaceId !== 'string' || !fileName || typeof fileName !== 'string') {
        return res.status(400).json({ success: false, error: 'Space ID and fileName are required' });
    }

    const zipName = fileName.replace('.json', '-with-assets.zip');
    const zipPath = path.join(process.cwd(), 'backups', spaceId, zipName);



    if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ success: false, error: 'Asset archive not found (it might have been deleted after a previous download attempt)' });
    }

    try {
        const stats = fs.statSync(zipPath);

        // Set headers for download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
        res.setHeader('Content-Length', stats.size);

        // Stream the file
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);

        // Note: We no longer delete immediately here to allow retries. 
        // Files are auto-purged by the backup.ts cleanup routine after 1 hour.

        fileStream.on('error', () => {
            if (!res.headersSent) {
                return res.status(500).json({ success: false, error: 'Internal server error' });
            }
        });

    } catch {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

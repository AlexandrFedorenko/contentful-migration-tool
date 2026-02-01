import type { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'path';
import * as fs from 'fs';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { spaceId, fileName } = req.query;

    if (!spaceId || !fileName || typeof spaceId !== 'string' || typeof fileName !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Space ID and file name are required'
        });
    }

    try {
        const backupFilePath = path.join(process.cwd(), 'backups', spaceId, fileName);

        if (!fs.existsSync(backupFilePath)) {
            return res.status(404).json({
                success: false,
                error: 'Backup file not found'
            });
        }

        // Read the file
        const fileContent = fs.readFileSync(backupFilePath);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fileContent.length);

        // Send the file
        res.status(200).send(fileContent);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to download backup'
        });
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { spaceId, filename } = req.query;

    if (!spaceId || typeof spaceId !== 'string' || !filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Space ID and filename are required' });
    }

    try {

        const backupsDir = path.join(process.cwd(), 'backups', spaceId);
        const filePath = path.join(backupsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonContent = JSON.parse(fileContent);

        return res.status(200).json(jsonContent);
    } catch (error) {
        console.error('Error reading backup file:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to read backup file'
        });
    }
}

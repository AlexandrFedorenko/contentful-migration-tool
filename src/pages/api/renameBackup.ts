import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface RenameBackupRequest {
    spaceId: string;
    oldFileName: string;
    newFileName: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { spaceId, oldFileName, newFileName } = req.body as RenameBackupRequest;

        if (!spaceId || !oldFileName || !newFileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate new filename (simple check to prevent directory traversal or invalid chars)
        if (!/^[a-zA-Z0-9-_.]+$/.test(newFileName)) {
            return res.status(400).json({ error: 'Invalid filename. Use only letters, numbers, dashes, underscores, and dots.' });
        }

        // Ensure .json extension
        const finalNewFileName = newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`;

        const backupDir = path.join(process.cwd(), 'backups', spaceId);
        const oldPath = path.join(backupDir, oldFileName);
        const newPath = path.join(backupDir, finalNewFileName);

        if (!fs.existsSync(oldPath)) {
            return res.status(404).json({ error: 'Original backup file not found' });
        }

        if (fs.existsSync(newPath)) {
            return res.status(409).json({ error: 'A backup with this name already exists' });
        }

        fs.renameSync(oldPath, newPath);

        res.status(200).json({ success: true, newFileName: finalNewFileName });
    } catch (error) {
        console.error('Rename backup error:', error);
        res.status(500).json({ error: 'Failed to rename backup' });
    }
}

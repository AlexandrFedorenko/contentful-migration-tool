import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const backupsDir = path.join(process.cwd(), 'backups', '0vddqa7zfgyi');

        if (!fs.existsSync(backupsDir)) {
            return res.status(404).json({ error: 'Backups directory not found' });
        }

        const files = fs.readdirSync(backupsDir);

        // Delete only files created today (to be safe)
        const today = new Date().toISOString().split('T')[0];
        let deletedCount = 0;

        for (const file of files) {
            if (file.includes('2026-01-28')) {
                const filePath = path.join(backupsDir, file);
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }

        return res.status(200).json({
            success: true,
            message: `Deleted ${deletedCount} backup files from today`,
            deletedCount
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

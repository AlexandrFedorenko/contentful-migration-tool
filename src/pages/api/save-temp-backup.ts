import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from 'fs';
import * as path from 'path';

interface SaveTempBackupRequest {
    spaceId: string;
    fileName: string;
    content: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    const { spaceId, fileName, content }: SaveTempBackupRequest = req.body;

    if (!spaceId || !fileName || !content) {
        return res.status(400).json({
            success: false,
            error: "Space ID, file name and content are required"
        });
    }

    try {
        const backupDir = path.join(process.cwd(), 'backups', spaceId);
        fs.mkdirSync(backupDir, { recursive: true });

        const filePath = path.join(backupDir, fileName);
        fs.writeFileSync(filePath, content, 'utf-8');

        return res.status(200).json({
            success: true,
            fileName
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save temporary backup'
        });
    }
}

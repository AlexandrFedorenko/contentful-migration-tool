import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Verify admin status
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN' && req.method === 'DELETE') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const { file } = req.query;

        if (!file || typeof file !== 'string') {
            return res.status(400).json({ success: false, error: 'File path is required' });
        }

        // Security check: Ensure the file is within backups/logs directory
        const appDir = process.cwd();
        const safeDir = path.join(appDir, 'backups', 'logs');
        const filePath = path.join(appDir, file);

        if (!filePath.startsWith(safeDir)) {
            return res.status(403).json({ success: false, error: 'Access denied: Directory traversal' });
        }

        if (req.method === 'GET') {
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, error: 'File not found' });
            }
            const content = fs.readFileSync(filePath, 'utf8');
            return res.status(200).json({
                success: true,
                data: { content }
            });
        }

        if (req.method === 'DELETE') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return res.status(200).json({
                success: true,
                data: { message: 'Log file deleted' }
            });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin Error Log API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

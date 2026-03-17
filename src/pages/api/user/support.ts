import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    try {
        const { message, email, name, screenshot } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let screenshotUrl = null;
        if (screenshot && typeof screenshot === 'string' && screenshot.startsWith('data:image/')) {
            // Validate image type
            const mimeType = screenshot.split(';')[0].split(':')[1];
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType)) {
                return res.status(400).json({ success: false, error: 'Only PNG and JPEG images are allowed' });
            }

            try {
                const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                
                const appDir = process.cwd();
                const screenshotsDir = path.join(appDir, 'public', 'screenshots');
                
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const fileName = `${uuidv4()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
                const filePath = path.join(screenshotsDir, fileName);
                
                fs.writeFileSync(filePath, Uint8Array.from(buffer));
                screenshotUrl = `/screenshots/${fileName}`;
            } catch (e) {
                console.error('Failed to save screenshot:', e);
                // Continue without screenshot if saving fails
            }
        }

        // Use user.update to create the support ticket through the relation
        // This is often more stable in Prisma when field names are ambiguous
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                supportTickets: {
                    create: {
                        email: email.trim(),
                        name: name?.trim() || null,
                        message: message.trim(),
                        screenshotUrl,
                        status: 'OPEN'
                    }
                }
            },
            include: {
                supportTickets: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const supportRequest = updatedUser.supportTickets[0];

        return res.status(201).json({ success: true, data: supportRequest });
    } catch (error) {
        console.error('Support request error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

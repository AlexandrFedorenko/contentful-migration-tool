import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);
    const { id } = req.query;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid ID' });
    }

    try {
        // Verify admin status
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (req.method === 'GET') {
            const supportRequest = await prisma.supportRequest.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            clerkId: true,
                            displayName: true,
                            email: true
                        }
                    }
                }
            });

            if (!supportRequest) {
                return res.status(404).json({ success: false, error: 'Request not found' });
            }

            return res.status(200).json({ success: true, data: supportRequest });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin Support Single API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

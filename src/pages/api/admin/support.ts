import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (req.method === 'GET') {
            const requests = await prisma.supportRequest.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            clerkId: true
                        }
                    }
                }
            });

            return res.status(200).json({ success: true, data: requests });
        }

        if (req.method === 'PUT') {
            const { id, status } = req.body;

            if (!id || !status) {
                return res.status(400).json({ success: false, error: 'Missing id or status' });
            }

            const updatedRequest = await prisma.supportRequest.update({
                where: { id },
                data: { status }
            });

            return res.status(200).json({ success: true, data: updatedRequest });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin Support API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

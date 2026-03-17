import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Verify admin status
        const caller = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true }
        });

        if (caller?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (req.method === 'GET') {
            // Fetch all users with backup count and total stats
            const users = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    clerkId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    displayName: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: { backups: true, scripts: true, tokens: true }
                    }
                }
            });

            // Merge Clerk ban status (optional, but good for suspension)
            const client = await clerkClient();
            const clerkUsers = await client.users.getUserList({ limit: 500 }); // simplified

            // Primary admin = oldest ADMIN account (cannot be modified)
            const primaryAdmin = users
                .filter(u => u.role === 'ADMIN')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
            
            const enrichedUsers = users.map(user => {
                const clerkUser = clerkUsers.data.find(cu => cu.id === user.clerkId);
                return {
                    ...user,
                    isBanned: clerkUser?.banned || false,
                    isPrimaryAdmin: primaryAdmin?.id === user.id,
                };
            });

            return res.status(200).json({ success: true, data: enrichedUsers });
        }

        if (req.method === 'PUT') {
            const { id, action, role } = req.body;

            if (!id || !action) {
                return res.status(400).json({ success: false, error: 'Missing target user id or action' });
            }

            const targetUser = await prisma.user.findUnique({ where: { id } });
            if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });
            if (targetUser.id === caller.id) return res.status(400).json({ success: false, error: 'Cannot modify your own account via this endpoint' });

            // Block modifications to the primary admin (oldest ADMIN account)
            const primaryAdmin = await prisma.user.findFirst({
                where: { role: 'ADMIN' },
                orderBy: { createdAt: 'asc' },
                select: { id: true },
            });
            if (primaryAdmin && targetUser.id === primaryAdmin.id) {
                return res.status(403).json({ success: false, error: 'Cannot modify the primary admin account' });
            }

            const client = await clerkClient();

            if (action === 'change_role') {
                if (role !== 'ADMIN' && role !== 'MEMBER') {
                    return res.status(400).json({ success: false, error: 'Invalid role' });
                }
                const updatedUser = await prisma.user.update({
                    where: { id },
                    data: { role }
                });
                return res.status(200).json({ success: true, data: updatedUser, message: 'Role updated' });
            }

            if (action === 'suspend') {
                await client.users.banUser(targetUser.clerkId);
                return res.status(200).json({ success: true, message: 'User suspended successfully' });
            }

            if (action === 'unsuspend') {
                await client.users.unbanUser(targetUser.clerkId);
                return res.status(200).json({ success: true, message: 'User unsuspended successfully' });
            }

            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin Users API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

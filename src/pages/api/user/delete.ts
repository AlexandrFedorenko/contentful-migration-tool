import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // 1. Delete all data from the local database.
        // Prisma schema defines onDelete: Cascade for all user relations.
        await prisma.user.delete({
            where: { clerkId: userId }
        });

        // 2. Delete the user from Clerk (Identity Provider)
        const client = await clerkClient();
        await client.users.deleteUser(userId);

        return res.status(200).json({ success: true, message: 'Account and all data deleted successfully' });
    } catch (error) {
        // If the user was already deleted from local db but clerk fails, or if clerk is already gone
        console.error('Account deletion error:', error);
        
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
             // Prisma record not found - maybe already deleted
             return res.status(404).json({ success: false, error: 'User not found in local database' });
        }
        
        return res.status(500).json({ success: false, error: 'Failed to delete account' });
    }
}

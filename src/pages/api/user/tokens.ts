import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, contentfulToken: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (req.method === 'GET') {
            const tokens = await prisma.contentfulToken.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    alias: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return res.status(200).json({ success: true, data: tokens });
        }

        if (req.method === 'POST') {
            const { alias, token } = req.body;
            
            if (!alias || !token) {
                return res.status(400).json({ success: false, error: 'Alias and token are required' });
            }

            const encryptedToken = encrypt(token.trim());
            
            // Logic Change: All tokens are inactive by default (manual activation required)
            const newToken = await prisma.contentfulToken.create({
                data: {
                    alias: alias.trim(),
                    token: encryptedToken,
                    userId: user.id,
                    isActive: false,
                }
            });

            return res.status(201).json({ 
                success: true, 
                data: {
                    id: newToken.id,
                    alias: newToken.alias,
                    isActive: newToken.isActive,
                    createdAt: newToken.createdAt
                } 
            });
        }

        if (req.method === 'PUT') {
            const { id, action, alias } = req.body;

            if (action === 'rename') {
                if (!alias) return res.status(400).json({ success: false, error: 'Alias is required' });
                
                const updatedToken = await prisma.contentfulToken.update({
                    where: { id },
                    data: { alias: alias.trim() }
                });

                return res.status(200).json({ success: true, data: updatedToken });
            }

            if (action === 'activate') {
                // Ensure the token exists and belongs to the user
                const targetToken = await prisma.contentfulToken.findUnique({
                    where: { id }
                });

                if (!targetToken || targetToken.userId !== user.id) {
                    return res.status(404).json({ success: false, error: 'Token not found' });
                }

                // Deactivate all tokens for this user
                await prisma.contentfulToken.updateMany({
                    where: { userId: user.id },
                    data: { isActive: false }
                });

                // Activate target token
                await prisma.contentfulToken.update({
                    where: { id },
                    data: { isActive: true }
                });

                // Sync active token to User for backward compatibility
                await prisma.user.update({
                    where: { id: user.id },
                    data: { contentfulToken: targetToken.token }
                });

                return res.status(200).json({ success: true, message: 'Token activated' });
            }

            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id || typeof id !== 'string') {
                return res.status(400).json({ success: false, error: 'Token ID required' });
            }

            const targetToken = await prisma.contentfulToken.findUnique({
                where: { id }
            });

            if (!targetToken || targetToken.userId !== user.id) {
                return res.status(404).json({ success: false, error: 'Token not found' });
            }

            await prisma.contentfulToken.delete({
                where: { id }
            });

            // If we deleted the active token, we should either set another active or clear User.contentfulToken
            if (targetToken.isActive) {
                const nextToken = await prisma.contentfulToken.findFirst({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                });

                if (nextToken) {
                    await prisma.contentfulToken.update({
                        where: { id: nextToken.id },
                        data: { isActive: true }
                    });
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { contentfulToken: nextToken.token }
                    });
                } else {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { contentfulToken: null }
                    });
                }
            }

            return res.status(200).json({ success: true, message: 'Token deleted' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('User Tokens API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

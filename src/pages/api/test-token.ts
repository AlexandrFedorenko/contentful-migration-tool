import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentfulManagement } from '@/utils/contentful-management';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { token: rawToken } = req.body;

        let tokenToTest: string;

        if (rawToken && rawToken.trim()) {
            // Test the provided (new) token directly
            tokenToTest = rawToken.trim();
        } else {
            // Test the stored token
            const user = await prisma.user.findUnique({ where: { clerkId: userId } });
            if (!user || !user.contentfulToken) {
                return res.status(400).json({ success: false, error: 'No token saved. Please enter a token first.' });
            }
            tokenToTest = decrypt(user.contentfulToken);
        }

        // Try to call CMA to verify the token
        const client = ContentfulManagement.getClient(tokenToTest);
        const spacesCollection = await client.getSpaces({ limit: 5 });

        return res.status(200).json({
            success: true,
            data: {
                valid: true,
                spacesCount: spacesCollection.total,
                spaces: spacesCollection.items.map(s => ({ id: s.sys.id, name: s.name }))
            }
        });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        // CMA returns 401 for invalid/expired tokens
        const isAuthError = errMsg.includes('401') || errMsg.includes('AccessTokenInvalid') || errMsg.includes('Unauthorized');
        const isExpired = errMsg.includes('expired') || errMsg.includes('revoked');

        return res.status(200).json({
            success: true,
            data: {
                valid: false,
                reason: isExpired ? 'expired' : isAuthError ? 'invalid' : 'error',
                message: errMsg
            }
        });
    }
}

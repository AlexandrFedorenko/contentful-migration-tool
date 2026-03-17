import type { NextApiRequest, NextApiResponse } from "next";

interface ContentfulAuthBrowserResponse {
    success: boolean;
    data?: {
        message: string;
    };
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ContentfulAuthBrowserResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const { action } = req.body;

    if (action === 'logout') {
        // Just clear cookies/cache for the app session if needed
        res.setHeader('Set-Cookie', [
            'contentful_token=; Path=/; Max-Age=0',
            'contentful_logged_in=; Path=/; Max-Age=0'
        ]);
        return res.status(200).json({ success: true, data: { message: 'Logged out' } });
    }

    return res.status(400).json({
        success: false,
        error: 'This authentication method is deprecated. Please manage your Contentful connection in the User Profile.'
    });
}
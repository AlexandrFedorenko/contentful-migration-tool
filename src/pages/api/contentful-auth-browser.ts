import type { NextApiRequest, NextApiResponse } from "next";
import { ContentfulCLI } from '@/utils/contentful-cli';
import { authCache } from '@/utils/auth-cache';
import { resetAuthCache } from './check-auth';

interface ContentfulAuthBrowserResponse {
    success: boolean;
    message?: string;
    authUrl?: string;
    browser_url?: string;
    token?: string;
}

type AuthAction = 'getAuthUrl' | 'saveToken' | 'logout' | 'start-login';

interface AuthRequestBody {
    action: AuthAction;
    token?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ContentfulAuthBrowserResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { action, token }: AuthRequestBody = req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                message: 'Action is required'
            });
        }

        if (action === 'getAuthUrl' || action === 'start-login') {
            const authUrlResult = await ContentfulCLI.getAuthUrl();

            if (!authUrlResult) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get auth URL from Contentful CLI'
                });
            }

            return res.status(200).json({
                success: true,
                authUrl: authUrlResult,
                browser_url: authUrlResult
            });
        }

        if (action === 'saveToken') {
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }

            process.env.CONTENTFUL_MANAGEMENT_TOKEN = token;
            await ContentfulCLI.saveToken(token);
            authCache.reset();
            resetAuthCache();

            return res.status(200).json({
                success: true,
                message: 'Token saved successfully'
            });
        }

        if (action === 'logout') {
            const success = await ContentfulCLI.logout();
            authCache.reset();
            resetAuthCache();

            res.setHeader('Set-Cookie', [
                'contentful_token=; Path=/; Max-Age=0',
                'contentful_logged_in=; Path=/; Max-Age=0'
            ]);

            return res.status(200).json({
                success: true,
                message: success
                    ? 'Successfully logged out from Contentful'
                    : 'Logout process may not have completed successfully, but cache was cleared'
            });
        }

        return res.status(400).json({
            success: false,
            message: `Unknown action: ${action}`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'An error occurred while processing the request'
        });
    }
}
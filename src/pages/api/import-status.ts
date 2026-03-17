import type { NextApiRequest, NextApiResponse } from "next";

interface ImportStatusResponse {
    success: boolean;
    data?: {
        completed: boolean;
        status: string;
        statistics?: Record<string, unknown>;
        message?: string;
    };
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ImportStatusResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        return res.status(200).json({
            success: true,
            data: {
                completed: false,
                status: "not_implemented",
                message: "Import status check not implemented yet"
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to check import status"
        });
    }
} 
import type { NextApiRequest, NextApiResponse } from "next";

interface ImportStatusResponse {
    completed?: boolean;
    status?: string;
    statistics?: Record<string, any>;
    message?: string;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ImportStatusResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Проверяем статус импорта
        // TODO: Реализовать проверку статуса импорта
        return res.json({
            completed: false,
            status: "not_implemented",
            message: "Import status check not implemented yet"
        });
        
    } catch (error) {
        console.error("❌ Import status check error:", error);
        return res.status(500).json({ 
            error: "Failed to check import status",
            completed: false,
            status: "error" 
        });
    }
} 
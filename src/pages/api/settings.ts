import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { userId } = getAuth(req);

    if (req.method === "GET") {
        try {
            // Fetch settings, or create default if not exists
            let settings = await prisma.appSettings.findFirst();

            if (!settings) {
                settings = await prisma.appSettings.create({
                    data: {
                        id: "default",
                        betaBannerEnabled: true,
                        betaBannerText: "🚀 This is a beta version of the app",
                        maxAssetSizeMB: 1024,
                        maxBackupsPerUser: 1,
                        enableAssetBackups: true,
                    },
                });
            }

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            return res.status(500).json({ error: "Failed to fetch settings" });
        }
    }

    if (req.method === "POST") {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            // Verify user is admin
            const user = await prisma.user.findUnique({ where: { clerkId: userId } });
            if (!user || user.role !== "ADMIN") {
                return res.status(403).json({ error: "Forbidden: Admins only" });
            }

            const {
                betaBannerEnabled,
                betaBannerText,
                tickerEnabled,
                tickerText,
                maxAssetSizeMB,
                maxBackupsPerUser,
                enableAssetBackups
            } = req.body;

            const settings = await prisma.appSettings.upsert({
                where: { id: "default" },
                update: {
                    betaBannerEnabled,
                    betaBannerText,
                    tickerEnabled,
                    tickerText,
                    maxAssetSizeMB: maxAssetSizeMB ? parseInt(maxAssetSizeMB as string) : 1024,
                    maxBackupsPerUser: maxBackupsPerUser ? parseInt(maxBackupsPerUser as string) : 1,
                    enableAssetBackups: enableAssetBackups ?? true,
                    updatedBy: userId,
                },
                create: {
                    id: "default",
                    betaBannerEnabled,
                    betaBannerText,
                    tickerEnabled,
                    tickerText,
                    maxAssetSizeMB: maxAssetSizeMB ? parseInt(maxAssetSizeMB as string) : 1024,
                    maxBackupsPerUser: maxBackupsPerUser ? parseInt(maxBackupsPerUser as string) : 1,
                    enableAssetBackups: enableAssetBackups ?? true,
                    updatedBy: userId,
                },
            });

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error("Failed to update settings:", error);
            return res.status(500).json({ error: "Failed to update settings" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}

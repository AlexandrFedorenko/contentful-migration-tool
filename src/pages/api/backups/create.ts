import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { name, description, content, target } = req.body; // target: 'LOCAL', 'GOOGLE', 'DROPBOX'

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        // Validate Local Limit
        if (target === 'LOCAL') {
            const count = await prisma.backupRecord.count({
                where: { userId: user.id, type: 'LOCAL_DB' }
            });

            if (count >= 5) {
                return res.status(400).json({
                    success: false,
                    error: "Local backup limit reached (5). Please delete old backups or use Cloud Storage."
                });
            }

            await prisma.backupRecord.create({
                data: {
                    userId: user.id,
                    name,
                    description,
                    type: 'LOCAL_DB',
                    content: content, // Save JSON to DB
                    spaceId: req.body.spaceId || 'unknown'
                }
            });

            return res.status(200).json({
                success: true,
                data: { message: "Saved locally" }
            });
        }

        return res.status(400).json({ success: false, error: "Invalid target" });

    } catch (error) {
        console.error("Backup Error", error);
        return res.status(500).json({ success: false, error: "Failed to create backup" });
    }
}

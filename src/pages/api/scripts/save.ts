import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, description, content } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Validate Script Limit (10)
        const count = await prisma.script.count({
            where: { userId: user.id }
        });

        if (count >= 10) {
            return res.status(400).json({
                error: "Script limit reached (10). Please delete old scripts to save new ones."
            });
        }

        await prisma.script.create({
            data: {
                userId: user.id,
                name,
                description,
                content,
            }
        });

        return res.status(200).json({ success: true, message: "Script saved successfully" });

    } catch (error) {
        console.error("Script Save Error", error);
        return res.status(500).json({ error: "Failed to save script" });
    }
}

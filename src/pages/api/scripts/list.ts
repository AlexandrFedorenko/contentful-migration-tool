import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const scripts = await prisma.script.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, description: true, createdAt: true } // Don't return content list to save bandwidth
        });

        return res.status(200).json({ scripts });

    } catch (error) {
        console.error("List Scripts Error", error);
        return res.status(500).json({ error: "Failed to list scripts" });
    }
}

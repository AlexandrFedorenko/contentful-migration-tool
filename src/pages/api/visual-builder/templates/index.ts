import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        if (req.method === "GET") {
            const templates = await prisma.visualBuilderTemplate.findMany({
                where: { userId: user.id },
                orderBy: { updatedAt: 'desc' }
            });
            return res.status(200).json({
                success: true,
                data: templates
            });
        }

        if (req.method === "POST") {
            const { name, description, content, category } = req.body;

            if (!name || !content) {
                return res.status(400).json({ success: false, error: "Name and content are required" });
            }

            const template = await prisma.visualBuilderTemplate.create({
                data: {
                    name,
                    description,
                    content,
                    category: category || 'custom',
                    userId: user.id
                }
            });
            return res.status(201).json({
                success: true,
                data: template
            });
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (error) {
        console.error("Template API Error", error);
        return res.status(500).json({ success: false, error: "Failed to process request" });
    }
}

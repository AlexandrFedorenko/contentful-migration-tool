import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.query;

    if (req.method === "DELETE") {
        try {
            const user = await prisma.user.findUnique({ where: { clerkId: userId } });
            if (!user) return res.status(404).json({ success: false, error: "User not found" });

            // Ensure the template belongs to the user
            const count = await prisma.visualBuilderTemplate.count({
                where: {
                    id: String(id),
                    userId: user.id
                }
            });

            if (count === 0) {
                return res.status(404).json({ success: false, error: "Template not found or unauthorized" });
            }

            await prisma.visualBuilderTemplate.delete({
                where: { id: String(id) }
            });

            return res.status(200).json({
                success: true,
                data: { deleted: true }
            });
        } catch (error) {
            console.error("Delete Template Error", error);
            return res.status(500).json({ success: false, error: "Failed to delete template" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}

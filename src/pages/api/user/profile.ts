import { getAuth, clerkClient } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { BackupService } from "@/utils/backup-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Ensure user exists in local DB
        let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

        // Sync user details from Clerk, but do not fail the entire endpoint if Clerk is temporarily unavailable.
        try {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(userId);
            const primaryEmail = clerkUser.emailAddresses.find((e: { id: string; emailAddress: string }) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

            if (!dbUser) {
                dbUser = await prisma.user.create({
                    data: {
                        clerkId: userId,
                        email: primaryEmail || `temp_${userId}@placeholder.com`,
                        firstName: clerkUser.firstName,
                        lastName: clerkUser.lastName,
                        role: 'MEMBER'
                    }
                });
            } else {
                const needsUpdate = dbUser.email !== primaryEmail ||
                    dbUser.firstName !== clerkUser.firstName ||
                    dbUser.lastName !== clerkUser.lastName;

                if (needsUpdate) {
                    dbUser = await prisma.user.update({
                        where: { id: dbUser.id },
                        data: {
                            email: primaryEmail || dbUser.email,
                            firstName: clerkUser.firstName,
                            lastName: clerkUser.lastName
                        }
                    });
                }
            }
        } catch {
            // Continue with local DB fallback if Clerk sync fails
            if (!dbUser) {
                dbUser = await prisma.user.create({
                    data: {
                        clerkId: userId,
                        email: `temp_${userId}@placeholder.com`,
                        role: 'MEMBER'
                    }
                });
            }
        }

        if (req.method === "GET") {
            const isContentfulTokenSet = !!dbUser.contentfulToken;
            const userWithConfigs = dbUser as unknown as { displayName?: string };

            let activity: { date: string; success: number; error: number; total: number }[] = [];
            let totalActions = 0;
            let successActions = 0;
            let backupCount = 0;

            try {
                const { range = '7d' } = req.query;
                const { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, format, eachDayOfInterval, eachMonthOfInterval } = await import('date-fns');

                const now = new Date();

                if (range === '7d' || range === '30d') {
                    const days = range === '7d' ? 7 : 30;
                    const startDate = subDays(now, days - 1);
                    const interval = eachDayOfInterval({ start: startDate, end: now });

                    activity = await Promise.all(interval.map(async (date) => {
                        const dayStart = startOfDay(date);
                        const dayEnd = endOfDay(date);
                        const [success, failed] = await Promise.all([
                            prisma.systemLog.count({
                                where: { userId: dbUser.id, timestamp: { gte: dayStart, lte: dayEnd }, status: 'SUCCESS' }
                            }),
                            prisma.systemLog.count({
                                where: { userId: dbUser.id, timestamp: { gte: dayStart, lte: dayEnd }, status: 'FAILED' }
                            })
                        ]);

                        const label = range === '7d' ? format(date, 'EEE') : format(date, 'dd');
                        return { date: label, success, error: failed, total: success + failed };
                    }));
                } else if (range === 'all') {
                    const interval = eachMonthOfInterval({ start: dbUser.createdAt, end: now });

                    activity = await Promise.all(interval.map(async (date) => {
                        const monthStart = startOfMonth(date);
                        const monthEnd = endOfMonth(date);
                        const [success, failed] = await Promise.all([
                            prisma.systemLog.count({
                                where: { userId: dbUser.id, timestamp: { gte: monthStart, lte: monthEnd }, status: 'SUCCESS' }
                            }),
                            prisma.systemLog.count({
                                where: { userId: dbUser.id, timestamp: { gte: monthStart, lte: monthEnd }, status: 'FAILED' }
                            })
                        ]);
                        return { date: format(date, 'MMM'), success, error: failed, total: success + failed };
                    }));
                }

                [totalActions, successActions, backupCount] = await Promise.all([
                    prisma.systemLog.count({ where: { userId: dbUser.id } }),
                    prisma.systemLog.count({ where: { userId: dbUser.id, status: 'SUCCESS' } }),
                    BackupService.getTotalBackupsCount(userId)
                ]);
            } catch {
                // Continue without stats on error
            }

            return res.status(200).json({
                role: dbUser.role,
                displayName: userWithConfigs.displayName || '',
                isContentfulTokenSet,
                backupCount,
                stats: {
                    activity,
                    totalActions,
                    successRate: totalActions > 0 ? Math.round((successActions / totalActions) * 100) : 100,
                }
            });
        }


        if (req.method === "POST") {
            const { displayName, contentfulToken } = req.body;
            const updateData: Record<string, string | null> = {};

            if (displayName !== undefined) updateData.displayName = displayName.trim();
            if (contentfulToken !== undefined) {
                updateData.contentfulToken = contentfulToken ? encrypt(contentfulToken.trim()) : null;
            }

            if (Object.keys(updateData).length > 0) {
                try {
                    const user = await prisma.user.update({
                        where: { clerkId: userId },
                        data: updateData
                    });

                    return res.status(200).json({
                        success: true,
                        message: "Profile updated successfully",
                        tokenSet: !!user.contentfulToken
                    });
                } catch {
                    return res.status(500).json({ error: "Failed to update user in database" });
                }
            } else {
                return res.status(400).json({ error: "Nothing to update" });
            }
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch {
        return res.status(500).json({ error: 'Failed to load user profile' });
    }
}

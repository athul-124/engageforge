import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import prisma from "@/lib/prisma";
import { calculateLevel, levelProgress, xpForNextLevel, getUserRank } from "@/lib/rule-engine";

// GET /api/user/[userId]?companyId=xxx - Get user profile with XP, level, badges
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
    try {
        const { userId: viewerId } = await whopsdk.verifyUserToken(await headers());
        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId is required" },
                { status: 400 }
            );
        }

        // Verify viewer has access to this company
        const access = await whopsdk.users.checkAccess(companyId, { id: viewerId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                earnedBadges: {
                    include: {
                        badge: true,
                    },
                    orderBy: { earnedAt: "desc" },
                },
            },
        });

        if (!user) {
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    id: userId,
                    companyId,
                    xp: 0,
                    level: 1,
                },
                include: {
                    earnedBadges: {
                        include: {
                            badge: true,
                        },
                    },
                },
            });
        }

        // Get user's rank
        const rank = await getUserRank(userId, companyId);

        // Calculate level progress
        const progress = levelProgress(user.xp);
        const xpToNextLevel = xpForNextLevel(user.level);
        const currentLevelXp = (user.level - 1) * (user.level - 1) * 100;

        return NextResponse.json({
            user: {
                id: user.id,
                displayName: user.displayName || user.whopUsername || "Anonymous",
                xp: user.xp,
                level: user.level,
                rank,
                progress: Math.round(progress),
                xpToNextLevel,
                xpProgress: user.xp - currentLevelXp,
                badges: user.earnedBadges.map((ub) => ({
                    id: ub.badge.id,
                    name: ub.badge.name,
                    description: ub.badge.description,
                    icon: ub.badge.icon,
                    earnedAt: ub.earnedAt,
                })),
            },
        });
    } catch (error) {
        console.error("[User API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

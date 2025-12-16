import prisma from "./prisma";

// ===== Types =====

export interface WebhookEvent {
    type: string;
    data: {
        user_id?: string;
        company_id?: string;
        [key: string]: unknown;
    };
}

// ===== Level Calculation =====

/**
 * Calculate level from XP using a simple formula:
 * Level = floor(sqrt(xp / 100)) + 1
 * 
 * Level thresholds:
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 400 XP
 * Level 4: 900 XP
 * Level 5: 1600 XP
 * ...
 */
export function calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
    return currentLevel * currentLevel * 100;
}

/**
 * Calculate progress percentage to next level
 */
export function levelProgress(xp: number): number {
    const level = calculateLevel(xp);
    const currentLevelXp = (level - 1) * (level - 1) * 100;
    const nextLevelXp = level * level * 100;
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(Math.max(progress, 0), 100);
}

// ===== Core Rule Engine =====

/**
 * Process a webhook event and award XP based on matching rules
 */
export async function processEvent(
    event: WebhookEvent,
    companyId: string
): Promise<{
    xpAwarded: number;
    badgesEarned: string[];
    levelUp: boolean;
    newLevel?: number;
}> {
    const userId = event.data.user_id;

    if (!userId) {
        console.log("[RuleEngine] No user_id in event, skipping");
        return { xpAwarded: 0, badgesEarned: [], levelUp: false };
    }

    // Find all active rules matching this event type for this company
    const matchingRules = await prisma.rule.findMany({
        where: {
            companyId,
            eventType: event.type,
            isActive: true,
        },
        include: {
            badge: true,
        },
    });

    if (matchingRules.length === 0) {
        console.log(`[RuleEngine] No matching rules for event type: ${event.type}`);
        return { xpAwarded: 0, badgesEarned: [], levelUp: false };
    }

    // Ensure user exists
    let user = await prisma.user.findUnique({
        where: { id: userId },
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
        });
    }

    const previousLevel = user.level;
    let totalXpAwarded = 0;
    const badgesEarned: string[] = [];

    // Process each matching rule
    for (const rule of matchingRules) {
        // Record XP event
        await prisma.xpEvent.create({
            data: {
                userId,
                ruleId: rule.id,
                xpAmount: rule.xpAmount,
                eventData: event.data as object,
            },
        });

        totalXpAwarded += rule.xpAmount;

        // Award badge if specified
        if (rule.badgeId) {
            try {
                await prisma.userBadge.create({
                    data: {
                        userId,
                        badgeId: rule.badgeId,
                    },
                });
                if (rule.badge) {
                    badgesEarned.push(rule.badge.name);
                }
            } catch (error) {
                // Badge already earned - unique constraint violation
                console.log(`[RuleEngine] User ${userId} already has badge ${rule.badgeId}`);
            }
        }
    }

    // Update user XP and level
    const newXp = user.xp + totalXpAwarded;
    const newLevel = calculateLevel(newXp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            xp: newXp,
            level: newLevel,
        },
    });

    const levelUp = newLevel > previousLevel;

    console.log(
        `[RuleEngine] Processed event for user ${userId}: +${totalXpAwarded} XP, ` +
        `${badgesEarned.length} badges, level ${previousLevel} -> ${newLevel}`
    );

    return {
        xpAwarded: totalXpAwarded,
        badgesEarned,
        levelUp,
        newLevel: levelUp ? newLevel : undefined,
    };
}

// ===== Leaderboard Functions =====

/**
 * Get leaderboard for a company
 */
export async function getLeaderboard(
    companyId: string,
    limit: number = 10,
    offset: number = 0
) {
    const users = await prisma.user.findMany({
        where: { companyId },
        orderBy: { xp: "desc" },
        take: limit,
        skip: offset,
        include: {
            earnedBadges: {
                include: {
                    badge: true,
                },
            },
        },
    });

    return users.map((user, index) => ({
        rank: offset + index + 1,
        userId: user.id,
        displayName: user.displayName || user.whopUsername || "Anonymous",
        xp: user.xp,
        level: user.level,
        badgeCount: user.earnedBadges.length,
    }));
}

/**
 * Get a user's rank on the leaderboard
 */
export async function getUserRank(
    userId: string,
    companyId: string
): Promise<number> {
    const higherRankedCount = await prisma.user.count({
        where: {
            companyId,
            xp: {
                gt: (await prisma.user.findUnique({ where: { id: userId } }))?.xp ?? 0,
            },
        },
    });

    return higherRankedCount + 1;
}

// ===== Supported Event Types =====

export const SUPPORTED_EVENT_TYPES = [
    { value: "payment.succeeded", label: "Payment Succeeded", description: "When a user makes a purchase" },
    { value: "membership.activated", label: "Membership Activated", description: "When a user joins or renews" },
    { value: "chat.message.created", label: "Chat Message", description: "When a user posts in chat" },
    { value: "challenge.completed", label: "Challenge Completed", description: "When a user completes a challenge" },
    { value: "content.viewed", label: "Content Viewed", description: "When a user views content" },
    { value: "poll.voted", label: "Poll Vote", description: "When a user votes in a poll" },
] as const;

export type SupportedEventType = typeof SUPPORTED_EVENT_TYPES[number]["value"];

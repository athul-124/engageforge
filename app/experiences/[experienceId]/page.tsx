import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import prisma from "@/lib/prisma";
import { calculateLevel, levelProgress, xpForNextLevel, getUserRank } from "@/lib/rule-engine";

// Types for Prisma query results
interface EarnedBadge {
	id: string;
	userId: string;
	badgeId: string;
	earnedAt: Date;
	badge: {
		id: string;
		name: string;
		description: string | null;
		icon: string;
	};
}

interface TopUser {
	id: string;
	companyId: string;
	whopUsername: string | null;
	displayName: string | null;
	xp: number;
	level: number;
	createdAt: Date;
	updatedAt: Date;
	_count: { earnedBadges: number };
}

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	// Verify user is logged in
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch data from Whop
	const [experience, whopUser, access] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(experienceId, { id: userId }),
	]);

	const companyId = typeof experience.company === "string" ? experience.company : experience.company.id;
	const displayName = whopUser.name || `@${whopUser.username}`;

	// Get or create user in our DB
	let user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			earnedBadges: {
				include: { badge: true },
				orderBy: { earnedAt: "desc" },
			},
		},
	});

	if (!user) {
		// Ensure company exists
		await prisma.company.upsert({
			where: { id: companyId },
			create: { id: companyId, name: "Whop Community" },
			update: {},
		});

		user = await prisma.user.create({
			data: {
				id: userId,
				companyId,
				displayName,
				whopUsername: whopUser.username || null,
				xp: 0,
				level: 1,
			},
			include: {
				earnedBadges: {
					include: { badge: true },
				},
			},
		});
	}

	// Calculate stats
	const level = calculateLevel(user.xp);
	const progress = levelProgress(user.xp);
	const nextLevelXp = xpForNextLevel(level);
	const currentLevelXp = (level - 1) * (level - 1) * 100;
	const xpProgress = user.xp - currentLevelXp;
	const rank = await getUserRank(userId, companyId);

	// Get leaderboard for context
	const topUsers = await prisma.user.findMany({
		where: { companyId },
		orderBy: { xp: "desc" },
		take: 5,
		include: {
			_count: { select: { earnedBadges: true } },
		},
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 p-6">
			<div className="max-w-2xl mx-auto space-y-6">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-white mb-2">
						🎮 Your Progress
					</h1>
					<p className="text-gray-400">
						Hey <span className="text-purple-400 font-medium">{displayName}</span>! Keep engaging to level up!
					</p>
				</div>

				{/* XP Progress Card */}
				<div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border border-gray-700/50">
					{/* Level & Rank */}
					<div className="flex items-center justify-between mb-6">
						<div>
							<p className="text-gray-400 text-sm">Current Level</p>
							<p className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
								Level {level}
							</p>
						</div>
						<div className="text-right">
							<p className="text-gray-400 text-sm">Leaderboard Rank</p>
							<p className="text-4xl font-bold text-white">
								#{rank}
							</p>
						</div>
					</div>

					{/* XP */}
					<div className="text-center mb-4">
						<span className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
							{user.xp.toLocaleString()}
						</span>
						<span className="text-2xl text-gray-400 ml-2">XP</span>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm text-gray-400">
							<span>Progress to Level {level + 1}</span>
							<span>{xpProgress.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
						</div>
						<div className="h-4 bg-gray-700/50 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-500 ease-out animate-pulse"
								style={{ width: `${Math.min(progress, 100)}%` }}
							/>
						</div>
						<p className="text-center text-sm text-gray-500">
							{Math.round(nextLevelXp - xpProgress).toLocaleString()} XP until next level
						</p>
					</div>
				</div>

				{/* Badges */}
				<div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
					<h2 className="text-xl font-bold text-white mb-4">
						🎖️ Your Badges ({user.earnedBadges.length})
					</h2>

					{user.earnedBadges.length > 0 ? (
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
							{user.earnedBadges.map((ub: EarnedBadge) => (
								<div
									key={ub.id}
									className="text-center p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition"
								>
									<span className="text-3xl block mb-2">{ub.badge.icon}</span>
									<p className="text-sm font-medium text-white truncate">{ub.badge.name}</p>
									<p className="text-xs text-purple-400">
										{new Date(ub.earnedAt).toLocaleDateString()}
									</p>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-gray-400">
							<p className="text-4xl mb-2">🎖️</p>
							<p>No badges yet. Keep engaging to earn your first badge!</p>
						</div>
					)}
				</div>

				{/* Mini Leaderboard */}
				<div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
					<h2 className="text-xl font-bold text-white mb-4">🏆 Top Members</h2>

					<div className="space-y-2">
						{topUsers.map((u: TopUser, index: number) => (
							<div
								key={u.id}
								className={`
                  flex items-center gap-3 p-3 rounded-lg
                  ${u.id === userId
										? "bg-purple-500/20 border border-purple-500/30"
										: "bg-gray-700/30"
									}
                `}
							>
								<span className="text-xl w-8 text-center">
									{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-white font-medium truncate">
										{u.displayName || u.whopUsername || "Anonymous"}
										{u.id === userId && <span className="text-purple-400 ml-1">(You)</span>}
									</p>
									<p className="text-sm text-gray-400">Level {u.level}</p>
								</div>
								<p className="font-bold text-purple-400">{u.xp.toLocaleString()} XP</p>
							</div>
						))}
					</div>
				</div>

				{/* Encouragement */}
				<div className="text-center text-gray-500 text-sm">
					<p>💡 Tip: Chat, complete challenges, and engage to earn more XP!</p>
				</div>
			</div>
		</div>
	);
}

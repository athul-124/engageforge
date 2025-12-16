import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import prisma from "@/lib/prisma";

// Types for Prisma query results
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

interface XpEventWithRelations {
	id: string;
	userId: string;
	ruleId: string;
	xpAmount: number;
	eventData: unknown;
	createdAt: Date;
	user: {
		displayName: string | null;
		whopUsername: string | null;
	};
	rule: {
		name: string;
	};
}

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	// Verify user is logged in
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch company and user data from Whop
	const [company, user] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
	]);

	// Ensure company exists in our DB
	await prisma.company.upsert({
		where: { id: companyId },
		create: { id: companyId, name: company.title || "Whop Company" },
		update: { name: company.title || "Whop Company" },
	});

	// Get stats
	const [rulesCount, activeRulesCount, usersCount, totalXp, badgesCount] = await Promise.all([
		prisma.rule.count({ where: { companyId } }),
		prisma.rule.count({ where: { companyId, isActive: true } }),
		prisma.user.count({ where: { companyId } }),
		prisma.user.aggregate({ where: { companyId }, _sum: { xp: true } }),
		prisma.badge.count({ where: { companyId } }),
	]);

	// Get top 5 users
	const topUsers = await prisma.user.findMany({
		where: { companyId },
		orderBy: { xp: "desc" },
		take: 5,
		include: {
			_count: { select: { earnedBadges: true } },
		},
	});

	// Get recent XP events
	const recentEvents = await prisma.xpEvent.findMany({
		where: { user: { companyId } },
		orderBy: { createdAt: "desc" },
		take: 5,
		include: {
			user: true,
			rule: true,
		},
	});

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20">
			<div className="max-w-7xl mx-auto p-6 space-y-8">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white">
							🎮 EngageForge
						</h1>
						<p className="text-gray-400 mt-1">
							Welcome back, <span className="text-purple-400">{displayName}</span>
						</p>
					</div>
					<div className="flex gap-3">
						<Link
							href={`/dashboard/${companyId}/rules`}
							className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
						>
							Manage Rules
						</Link>
						<Link
							href={`/dashboard/${companyId}/badges`}
							className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
						>
							Manage Badges
						</Link>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<StatCard
						label="Total Users"
						value={usersCount}
						icon="👥"
						color="purple"
					/>
					<StatCard
						label="Active Rules"
						value={`${activeRulesCount}/${rulesCount}`}
						icon="📜"
						color="blue"
					/>
					<StatCard
						label="Total XP Earned"
						value={(totalXp._sum.xp || 0).toLocaleString()}
						icon="✨"
						color="yellow"
					/>
					<StatCard
						label="Badges Created"
						value={badgesCount}
						icon="🎖️"
						color="green"
					/>
					<StatCard
						label="Avg XP/User"
						value={usersCount > 0 ? Math.round((totalXp._sum.xp || 0) / usersCount) : 0}
						icon="📊"
						color="pink"
					/>
				</div>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Leaderboard Preview */}
					<div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-white">🏆 Top Members</h2>
							<Link
								href={`/dashboard/${companyId}/leaderboard`}
								className="text-sm text-purple-400 hover:text-purple-300"
							>
								View all →
							</Link>
						</div>

						{topUsers.length > 0 ? (
							<div className="space-y-3">
								{topUsers.map((user: TopUser, index: number) => (
									<div
										key={user.id}
										className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
									>
										<span className="text-xl w-8">
											{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
										</span>
										<div className="flex-1 min-w-0">
											<p className="text-white font-medium truncate">
												{user.displayName || user.whopUsername || "Anonymous"}
											</p>
											<p className="text-sm text-gray-400">
												Level {user.level} • {user._count.earnedBadges} badges
											</p>
										</div>
										<p className="font-bold text-purple-400">{user.xp.toLocaleString()} XP</p>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-400">
								<p className="text-4xl mb-2">🏆</p>
								<p>No users yet. Share your community to get started!</p>
							</div>
						)}
					</div>

					{/* Recent Activity */}
					<div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
						<h2 className="text-xl font-bold text-white mb-4">⚡ Recent Activity</h2>

						{recentEvents.length > 0 ? (
							<div className="space-y-3">
								{recentEvents.map((event: XpEventWithRelations) => (
									<div
										key={event.id}
										className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
									>
										<span className="text-xl">+{event.xpAmount}</span>
										<div className="flex-1 min-w-0">
											<p className="text-white text-sm truncate">
												{event.user.displayName || event.user.whopUsername || "User"} earned XP
											</p>
											<p className="text-xs text-gray-400">
												{event.rule.name} • {new Date(event.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-400">
								<p className="text-4xl mb-2">⚡</p>
								<p>No activity yet. Create rules to start tracking!</p>
							</div>
						)}
					</div>
				</div>

				{/* Quick Start Guide */}
				{rulesCount === 0 && (
					<div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
						<h2 className="text-xl font-bold text-white mb-2">🚀 Quick Start Guide</h2>
						<ol className="list-decimal list-inside space-y-2 text-gray-300">
							<li>
								<Link href={`/dashboard/${companyId}/badges`} className="text-purple-400 hover:underline">
									Create some badges
								</Link>{" "}
								to reward your members
							</li>
							<li>
								<Link href={`/dashboard/${companyId}/rules`} className="text-purple-400 hover:underline">
									Set up XP rules
								</Link>{" "}
								for actions like chatting, purchasing, etc.
							</li>
							<li>Configure webhooks in your Whop Developer Dashboard</li>
							<li>Watch your community engagement grow! 📈</li>
						</ol>
					</div>
				)}
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	icon,
	color,
}: {
	label: string;
	value: string | number;
	icon: string;
	color: "purple" | "blue" | "yellow" | "green" | "pink";
}) {
	const colorClasses = {
		purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
		blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
		yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
		green: "from-green-500/20 to-green-600/10 border-green-500/30",
		pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
	};

	return (
		<div
			className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}
		>
			<div className="flex items-center gap-2 mb-2">
				<span className="text-2xl">{icon}</span>
				<span className="text-sm text-gray-400">{label}</span>
			</div>
			<p className="text-2xl font-bold text-white">{value}</p>
		</div>
	);
}

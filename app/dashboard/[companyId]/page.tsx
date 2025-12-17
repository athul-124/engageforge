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
		<div className="min-h-screen bg-gradient-mesh">
			<div className="max-w-7xl mx-auto p-6 space-y-8">
				{/* Header with gradient */}
				<div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white flex items-center gap-3">
							<span className="animate-float">🎮</span>
							<span className="text-gradient">EngageForge</span>
						</h1>
						<p className="text-gray-400 mt-1">
							Welcome back, <span className="text-purple-400 font-medium">{displayName}</span>
						</p>
					</div>
					<div className="flex gap-3">
						<Link
							href={`/dashboard/${companyId}/rules`}
							className="btn-primary flex items-center gap-2"
						>
							<span>📜</span>
							Manage Rules
						</Link>
						<Link
							href={`/dashboard/${companyId}/badges`}
							className="px-4 py-3 glass-card glass-card-hover font-medium transition flex items-center gap-2"
						>
							<span>🎖️</span>
							Manage Badges
						</Link>
					</div>
				</div>

				{/* Stats Grid - Bento Style */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<StatCard
						label="Total Users"
						value={usersCount}
						icon="👥"
						color="purple"
						delay={0}
					/>
					<StatCard
						label="Active Rules"
						value={`${activeRulesCount}/${rulesCount}`}
						icon="📜"
						color="blue"
						delay={0.1}
					/>
					<StatCard
						label="Total XP Earned"
						value={(totalXp._sum.xp || 0).toLocaleString()}
						icon="✨"
						color="yellow"
						delay={0.2}
					/>
					<StatCard
						label="Badges Created"
						value={badgesCount}
						icon="🎖️"
						color="green"
						delay={0.3}
					/>
					<StatCard
						label="Avg XP/User"
						value={usersCount > 0 ? Math.round((totalXp._sum.xp || 0) / usersCount) : 0}
						icon="📊"
						color="pink"
						delay={0.4}
					/>
				</div>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Leaderboard Preview */}
					<div className="glass-card overflow-hidden">
						<div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<span className="animate-pulse-glow inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">🏆</span>
								Top Members
							</h2>
							<Link
								href={`/dashboard/${companyId}/leaderboard`}
								className="text-sm text-purple-400 hover:text-purple-300 transition"
							>
								View all →
							</Link>
						</div>

						{topUsers.length > 0 ? (
							<div className="divide-y divide-gray-700/30">
								{topUsers.map((user: TopUser, index: number) => (
									<div
										key={user.id}
										className="flex items-center gap-3 p-4 hover:bg-gray-700/30 transition-all animate-count-up"
										style={{ animationDelay: `${index * 0.1}s` }}
									>
										<div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${index === 0 ? 'rank-badge-1' :
												index === 1 ? 'rank-badge-2' :
													index === 2 ? 'rank-badge-3' : 'bg-gray-700'
											}`}>
											{index <= 2 ? ['🥇', '🥈', '🥉'][index] : index + 1}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-white font-medium truncate">
												{user.displayName || user.whopUsername || "Anonymous"}
											</p>
											<p className="text-sm text-gray-400">
												Level {user.level} • {user._count.earnedBadges} badges
											</p>
										</div>
										<p className="font-bold text-gradient-gold">{user.xp.toLocaleString()} XP</p>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12 text-gray-400">
								<p className="text-4xl mb-2 animate-float">🏆</p>
								<p>No users yet. Share your community to get started!</p>
							</div>
						)}
					</div>

					{/* Recent Activity */}
					<div className="glass-card overflow-hidden">
						<div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 px-6 py-4 border-b border-gray-700/50">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<span className="animate-pulse-glow inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">⚡</span>
								Recent Activity
							</h2>
						</div>

						{recentEvents.length > 0 ? (
							<div className="divide-y divide-gray-700/30">
								{recentEvents.map((event: XpEventWithRelations, index: number) => (
									<div
										key={event.id}
										className="flex items-center gap-3 p-4 hover:bg-gray-700/30 transition-all animate-count-up"
										style={{ animationDelay: `${index * 0.1}s` }}
									>
										<div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
											+{event.xpAmount}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-white text-sm truncate">
												<span className="font-medium">{event.user.displayName || event.user.whopUsername || "User"}</span> earned XP
											</p>
											<p className="text-xs text-gray-400">
												{event.rule.name} • {new Date(event.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12 text-gray-400">
								<p className="text-4xl mb-2 animate-float">⚡</p>
								<p>No activity yet. Create rules to start tracking!</p>
							</div>
						)}
					</div>
				</div>

				{/* Quick Start Guide */}
				{rulesCount === 0 && (
					<div className="glass-card p-6 border-purple-500/30 relative overflow-hidden">
						<div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10" />
						<div className="relative z-10">
							<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
								<span className="animate-float">🚀</span>
								Quick Start Guide
							</h2>
							<ol className="list-decimal list-inside space-y-3 text-gray-300">
								<li className="flex items-start gap-2">
									<span className="text-gray-500">1.</span>
									<span>
										<Link href={`/dashboard/${companyId}/badges`} className="text-purple-400 hover:underline font-medium">
											Create some badges
										</Link>{" "}
										to reward your members
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-gray-500">2.</span>
									<span>
										<Link href={`/dashboard/${companyId}/rules`} className="text-purple-400 hover:underline font-medium">
											Set up XP rules
										</Link>{" "}
										for actions like chatting, purchasing, etc.
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-gray-500">3.</span>
									<span>Configure webhooks in your Whop Developer Dashboard</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-gray-500">4.</span>
									<span>Watch your community engagement grow! 📈</span>
								</li>
							</ol>
						</div>
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
	delay = 0,
}: {
	label: string;
	value: string | number;
	icon: string;
	color: "purple" | "blue" | "yellow" | "green" | "pink";
	delay?: number;
}) {
	const colorClasses = {
		purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20",
		blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20",
		yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-yellow-500/20",
		green: "from-green-500/20 to-green-600/5 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/20",
		pink: "from-pink-500/20 to-pink-600/5 border-pink-500/30 hover:border-pink-400/50 hover:shadow-pink-500/20",
	};

	return (
		<div
			className={`stat-card bg-gradient-to-br ${colorClasses[color]} animate-count-up`}
			style={{ animationDelay: `${delay}s` }}
		>
			<div className="flex items-center gap-2 mb-3">
				<span className="text-2xl">{icon}</span>
				<span className="text-sm text-gray-400">{label}</span>
			</div>
			<p className="text-3xl font-bold text-white">{value}</p>
		</div>
	);
}

"use client";

import { useState } from "react";

interface LeaderboardUser {
    rank: number;
    userId: string;
    displayName: string;
    xp: number;
    level: number;
    badgeCount: number;
}

interface LeaderboardProps {
    users: LeaderboardUser[];
    currentUserId?: string;
}

export function Leaderboard({ users, currentUserId }: LeaderboardProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const getRankEmoji = (rank: number) => {
        switch (rank) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return `#${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return "from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
            case 2: return "from-gray-300/20 to-slate-400/10 border-gray-400/30";
            case 3: return "from-orange-600/20 to-amber-700/10 border-orange-500/30";
            default: return "from-gray-800/50 to-gray-900/50 border-gray-700/30";
        }
    };

    return (
        <div className="space-y-2">
            {users.map((user) => (
                <div
                    key={user.userId}
                    className={`
            flex items-center gap-4 p-4 rounded-xl border
            bg-gradient-to-r ${getRankColor(user.rank)}
            transition-all duration-200
            ${hoveredId === user.userId ? "scale-[1.02] shadow-lg" : ""}
            ${currentUserId === user.userId ? "ring-2 ring-purple-500/50" : ""}
          `}
                    onMouseEnter={() => setHoveredId(user.userId)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    {/* Rank */}
                    <div className="w-12 text-center">
                        <span className={`text-xl ${user.rank <= 3 ? "text-2xl" : "text-gray-400"}`}>
                            {getRankEmoji(user.rank)}
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                            {user.displayName}
                            {currentUserId === user.userId && (
                                <span className="ml-2 text-xs text-purple-400">(You)</span>
                            )}
                        </p>
                        <p className="text-sm text-gray-400">
                            Level {user.level} • {user.badgeCount} badge{user.badgeCount !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                        <p className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {user.xp.toLocaleString()} XP
                        </p>
                    </div>
                </div>
            ))}

            {users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">🏆</p>
                    <p>No users yet. Be the first to earn XP!</p>
                </div>
            )}
        </div>
    );
}

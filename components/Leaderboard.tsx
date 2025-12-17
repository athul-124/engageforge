"use client";

import { useState, useEffect } from "react";

interface LeaderboardUser {
    id: string;
    name: string;
    totalXp: number;
    level: number;
    _count?: {
        earnedBadges: number;
    };
}

interface LeaderboardProps {
    users: LeaderboardUser[];
    currentUserId?: string;
    maxDisplay?: number;
    showRank?: boolean;
}

export function Leaderboard({
    users,
    currentUserId,
    maxDisplay = 10,
    showRank = true
}: LeaderboardProps) {
    const [animatedUsers, setAnimatedUsers] = useState<LeaderboardUser[]>([]);

    // Stagger animation on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedUsers(users.slice(0, maxDisplay));
        }, 100);
        return () => clearTimeout(timer);
    }, [users, maxDisplay]);

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { emoji: "🥇", class: "rank-badge-1" };
        if (rank === 2) return { emoji: "🥈", class: "rank-badge-2" };
        if (rank === 3) return { emoji: "🥉", class: "rank-badge-3" };
        return { emoji: `#${rank}`, class: "bg-gray-700" };
    };

    const getAvatarGradient = (index: number) => {
        const gradients = [
            "from-purple-500 to-pink-500",
            "from-blue-500 to-cyan-500",
            "from-green-500 to-emerald-500",
            "from-orange-500 to-yellow-500",
            "from-red-500 to-rose-500",
        ];
        return gradients[index % gradients.length];
    };

    if (users.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="text-4xl mb-4 animate-float">🏆</div>
                <p className="text-gray-400">No members yet. Be the first to earn XP!</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-6 py-4 border-b border-gray-700/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="animate-pulse-glow inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
                        🏆
                    </span>
                    Leaderboard
                </h3>
            </div>

            {/* Leaderboard List */}
            <div className="divide-y divide-gray-700/30">
                {animatedUsers.map((user, index) => {
                    const rank = index + 1;
                    const rankInfo = getRankBadge(rank);
                    const isCurrentUser = user.id === currentUserId;
                    const delay = index * 0.1;

                    return (
                        <div
                            key={user.id}
                            className={`
                                flex items-center gap-4 px-6 py-4 transition-all duration-300
                                hover:bg-gray-700/30 animate-rank-enter
                                ${isCurrentUser ? 'bg-purple-900/20 border-l-4 border-purple-500' : ''}
                            `}
                            style={{ animationDelay: `${delay}s` }}
                        >
                            {/* Rank Badge */}
                            {showRank && (
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center
                                    text-sm font-bold transition-transform hover:scale-110
                                    ${rankInfo.class}
                                `}>
                                    {rank <= 3 ? rankInfo.emoji : rank}
                                </div>
                            )}

                            {/* Avatar */}
                            <div className="relative">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center
                                    bg-gradient-to-br ${getAvatarGradient(index)}
                                    text-white font-bold text-lg shadow-lg
                                `}>
                                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                {/* Level indicator ring */}
                                <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/50">
                                    {user.level}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                                    {user.name || "Anonymous"}
                                    {isCurrentUser && <span className="ml-2 text-xs text-purple-400">(You)</span>}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <span>Level {user.level}</span>
                                    {user._count?.earnedBadges ? (
                                        <span className="flex items-center gap-1">
                                            🎖️ {user._count.earnedBadges}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* XP Display */}
                            <div className="text-right">
                                <p className="text-lg font-bold text-gradient-gold">
                                    {user.totalXp.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">XP</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            {users.length > maxDisplay && (
                <div className="px-6 py-3 bg-gray-800/50 text-center">
                    <span className="text-sm text-gray-400">
                        +{users.length - maxDisplay} more members
                    </span>
                </div>
            )}
        </div>
    );
}

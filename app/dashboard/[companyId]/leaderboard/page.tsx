"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface LeaderboardUser {
    id: string;
    name: string;
    totalXp: number;
    level: number;
    _count?: {
        earnedBadges: number;
    };
}

export default function LeaderboardPage() {
    const params = useParams();
    const companyId = params.companyId as string;
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 20;

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/leaderboard?companyId=${companyId}&page=${page}&limit=${limit}`
            );
            if (res.ok) {
                const data = await res.json();
                setUsers(data.leaderboard || []);
                setHasMore(data.leaderboard?.length === limit);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }, [companyId, page]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const getRankStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-yellow-500 to-amber-500";
        if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400";
        if (rank === 3) return "bg-gradient-to-r from-amber-600 to-amber-700";
        return "bg-gray-700";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link
                            href={`/dashboard/${companyId}`}
                            className="text-gray-400 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
                        >
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
                        <p className="text-gray-400 mt-1">Top community members by XP</p>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-gray-800/50 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">
                            Loading leaderboard...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <p className="text-2xl mb-2">📊</p>
                            <p>No members yet. Activity will appear here once members start earning XP!</p>
                        </div>
                    ) : (
                        <>
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Member</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Level</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Badges</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">XP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => {
                                        const rank = (page - 1) * limit + index + 1;
                                        return (
                                            <tr
                                                key={user.id}
                                                className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankStyle(rank)}`}>
                                                        {rank}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold">
                                                            {user.name?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{user.name || "Unknown"}</p>
                                                            <p className="text-sm text-gray-400">Level {user.level}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                                                        {user.level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-gray-300">
                                                        {user._count?.earnedBadges || 0} 🎖️
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-yellow-400 font-bold">
                                                        {user.totalXp.toLocaleString()} XP
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>
                                <span className="text-gray-400">Page {page}</span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!hasMore}
                                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

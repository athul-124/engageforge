"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@whop/react/components";
import { BadgeGallery } from "@/components/BadgeGallery";

interface Badge {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    earnedCount: number;
}

export default function BadgesPage() {
    const params = useParams();
    const companyId = params.companyId as string;

    const [badges, setBadges] = useState<Badge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("🏆");

    const emojis = ["🏆", "⭐", "🎖️", "💎", "🔥", "⚡", "🎯", "🚀", "💪", "🎉", "👑", "🌟", "💥", "🏅", "🎊", "✨"];

    const fetchBadges = useCallback(async () => {
        try {
            const res = await fetch(`/api/badges?companyId=${companyId}`);
            if (!res.ok) throw new Error("Failed to fetch badges");
            const data = await res.json();
            setBadges(data.badges);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    const handleCreateBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/badges", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    name: name.trim(),
                    description: description.trim() || null,
                    icon,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create badge");
            }

            // Reset form and refresh
            setName("");
            setDescription("");
            setIcon("🏆");
            await fetchBadges();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create badge");
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">🎖️</div>
                    <p className="text-gray-400">Loading badges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div>
                    <Link
                        href={`/dashboard/${companyId}`}
                        className="text-gray-400 hover:text-white text-sm mb-2 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">🎖️ Badge Manager</h1>
                    <p className="text-gray-400 mt-1">
                        Create badges to reward your most engaged members
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Badge Form */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">✨ Create New Badge</h2>

                        <form onSubmit={handleCreateBadge} className="space-y-6">
                            {/* Icon Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Badge Icon
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {emojis.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setIcon(emoji)}
                                            className={`
                        w-12 h-12 text-2xl rounded-lg border-2 transition
                        ${icon === emoji
                                                    ? "bg-purple-600/30 border-purple-500"
                                                    : "bg-gray-700/30 border-gray-600 hover:border-gray-500"
                                                }
                      `}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Badge Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Chat Champion"
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe how members earn this badge..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                                />
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-gray-700/30 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{icon}</span>
                                    <div>
                                        <p className="font-semibold text-white">{name || "Badge Name"}</p>
                                        <p className="text-sm text-gray-400">{description || "Badge description"}</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="classic"
                                size="3"
                                className="w-full"
                                disabled={isCreating || !name.trim()}
                            >
                                {isCreating ? "Creating..." : "Create Badge"}
                            </Button>
                        </form>
                    </div>

                    {/* Existing Badges */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">
                            🎖️ Your Badges ({badges.length})
                        </h2>

                        {badges.length > 0 ? (
                            <div className="space-y-4">
                                {badges.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg"
                                    >
                                        <span className="text-3xl">{badge.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white">{badge.name}</p>
                                            {badge.description && (
                                                <p className="text-sm text-gray-400 truncate">{badge.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-purple-400">
                                                {badge.earnedCount} earned
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <BadgeGallery badges={[]} showEarnedDate={false} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

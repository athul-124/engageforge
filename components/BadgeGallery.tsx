"use client";

import { useState } from "react";

interface Badge {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    earnedAt?: string;
}

interface BadgeGalleryProps {
    badges: Badge[];
    title?: string;
    emptyMessage?: string;
    showEarnedDate?: boolean;
}

export function BadgeGallery({
    badges,
    title = "Badges",
    emptyMessage = "No badges earned yet. Complete activities to earn badges!",
    showEarnedDate = false,
}: BadgeGalleryProps) {
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    if (badges.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="text-5xl mb-4 animate-float opacity-50">🎖️</div>
                <p className="text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 px-6 py-4 border-b border-gray-700/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="animate-pulse-glow inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
                        🎖️
                    </span>
                    {title}
                    <span className="ml-auto text-sm font-normal text-gray-400">
                        {badges.length} earned
                    </span>
                </h3>
            </div>

            {/* Badge Grid */}
            <div className="p-6">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {badges.map((badge, index) => (
                        <div
                            key={badge.id}
                            className="badge-item group cursor-pointer tooltip"
                            data-tooltip={badge.name}
                            onClick={() => setSelectedBadge(badge)}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="
                                w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800
                                flex items-center justify-center text-2xl
                                border border-gray-600/50 hover:border-amber-500/50
                                shadow-lg hover:shadow-amber-500/20
                                transition-all duration-300 animate-count-up
                            ">
                                {badge.icon}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Badge Detail Modal */}
            {selectedBadge && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setSelectedBadge(null)}
                >
                    <div
                        className="glass-card p-8 max-w-sm mx-4 text-center animate-rank-enter"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Badge Icon */}
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-5xl border border-amber-500/30 animate-float">
                            {selectedBadge.icon}
                        </div>

                        {/* Badge Info */}
                        <h4 className="text-xl font-bold text-white mb-2">
                            {selectedBadge.name}
                        </h4>
                        {selectedBadge.description && (
                            <p className="text-gray-400 text-sm mb-4">
                                {selectedBadge.description}
                            </p>
                        )}

                        {/* Earned Date */}
                        {showEarnedDate && selectedBadge.earnedAt && (
                            <p className="text-xs text-gray-500">
                                Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                            </p>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedBadge(null)}
                            className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

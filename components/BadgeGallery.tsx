"use client";

interface Badge {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    earnedAt?: Date | string;
}

interface BadgeGalleryProps {
    badges: Badge[];
    showEarnedDate?: boolean;
}

export function BadgeGallery({ badges, showEarnedDate = true }: BadgeGalleryProps) {
    if (badges.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">🎖️</p>
                <p>No badges earned yet. Keep engaging!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
                <div
                    key={badge.id}
                    className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/30 hover:border-purple-500/50 transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                    {/* Badge Icon */}
                    <div className="text-center">
                        <span className="text-4xl block mb-2">{badge.icon}</span>
                        <p className="font-semibold text-white text-sm truncate">{badge.name}</p>
                        {badge.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                        )}
                        {showEarnedDate && badge.earnedAt && (
                            <p className="text-xs text-purple-400 mt-2">
                                {new Date(badge.earnedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <p className="text-sm font-medium text-white">{badge.name}</p>
                        {badge.description && (
                            <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

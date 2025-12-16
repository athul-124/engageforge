"use client";

interface XpProgressBarProps {
    xp: number;
    level: number;
    progress: number; // 0-100
    xpProgress: number; // XP gained in current level
    xpToNextLevel: number; // Total XP needed for next level
}

export function XpProgressBar({
    xp,
    level,
    progress,
    xpProgress,
    xpToNextLevel,
}: XpProgressBarProps) {
    return (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border border-gray-700/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-gray-400 text-sm">Current Level</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        Level {level}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-sm">Total XP</p>
                    <p className="text-2xl font-bold text-white">
                        {xp.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Progress to Level {level + 1}</span>
                    <span>{xpProgress.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP</span>
                </div>
                <div className="h-4 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <p className="text-center text-sm text-gray-500">
                    {Math.round(xpToNextLevel - xpProgress).toLocaleString()} XP until next level
                </p>
            </div>
        </div>
    );
}

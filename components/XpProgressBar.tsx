"use client";

interface XpProgressBarProps {
    currentXp: number;
    level: number;
    xpForNextLevel: number;
    xpToNextLevel: number;
    showDetails?: boolean;
}

export function XpProgressBar({
    currentXp,
    level,
    xpForNextLevel,
    xpToNextLevel,
    showDetails = true,
}: XpProgressBarProps) {
    const progress = Math.min(100, ((xpForNextLevel - xpToNextLevel) / xpForNextLevel) * 100);
    const currentLevelXp = xpForNextLevel - xpToNextLevel;

    return (
        <div className="glass-card glass-card-hover p-6 space-y-4">
            {/* Level Display */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Level Badge */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                            <span className="text-2xl font-bold text-white">{level}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full px-2 py-0.5 text-xs font-bold animate-float">
                            LVL
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white">Level {level}</h3>
                        <p className="text-sm text-gray-400">
                            {xpToNextLevel} XP to level {level + 1}
                        </p>
                    </div>
                </div>

                {/* Total XP */}
                <div className="text-right">
                    <p className="text-3xl font-bold text-gradient-gold animate-count-up">
                        {currentXp.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">Total XP</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="xp-bar-container h-4">
                    <div
                        className="xp-bar-fill h-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {showDetails && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                            {currentLevelXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                        </span>
                        <span className="text-purple-400 font-semibold">
                            {Math.round(progress)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Milestone Markers */}
            <div className="flex justify-between text-xs text-gray-500">
                <span>Level {level}</span>
                <span className="text-purple-400">●</span>
                <span>Level {level + 1}</span>
            </div>
        </div>
    );
}

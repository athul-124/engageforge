"use client";

import { useState } from "react";

interface EventType {
    value: string;
    label: string;
    description: string;
}

interface Badge {
    id: string;
    name: string;
    icon: string;
}

interface RuleBuilderProps {
    eventTypes: EventType[];
    badges: Badge[];
    onSubmit: (rule: {
        name: string;
        description: string;
        eventType: string;
        xpAmount: number;
        badgeId: string | null;
    }) => Promise<void>;
    isLoading?: boolean;
}

export function RuleBuilder({ eventTypes, badges, onSubmit, isLoading }: RuleBuilderProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState(eventTypes[0]?.value || "");
    const [xpAmount, setXpAmount] = useState(10);
    const [badgeId, setBadgeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Rule name is required");
            return;
        }

        if (!eventType) {
            setError("Event type is required");
            return;
        }

        if (xpAmount < 1) {
            setError("XP amount must be at least 1");
            return;
        }

        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                eventType,
                xpAmount,
                badgeId,
            });
            // Reset form
            setName("");
            setDescription("");
            setXpAmount(10);
            setBadgeId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create rule");
        }
    };

    const selectedEvent = eventTypes.find((e) => e.value === eventType);
    const selectedBadge = badges.find((b) => b.id === badgeId);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rule Name */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Rule Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Chat Champion Bonus"
                    className="input-modern w-full"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this rule rewards..."
                    rows={2}
                    className="input-modern w-full resize-none"
                />
            </div>

            {/* Event Type */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Trigger Event <span className="text-red-400">*</span>
                </label>
                <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="select-modern w-full"
                >
                    {eventTypes.map((event) => (
                        <option key={event.value} value={event.value}>
                            {event.label}
                        </option>
                    ))}
                </select>
                {selectedEvent && (
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="text-purple-400">ℹ️</span>
                        {selectedEvent.description}
                    </p>
                )}
            </div>

            {/* XP Amount */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                    XP to Award <span className="text-red-400">*</span>
                </label>
                <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="500"
                            value={xpAmount}
                            onChange={(e) => setXpAmount(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={xpAmount}
                                onChange={(e) => setXpAmount(parseInt(e.target.value) || 1)}
                                className="w-20 input-modern text-center text-lg font-bold"
                            />
                            <span className="text-purple-400 font-semibold">XP</span>
                        </div>
                    </div>
                    {/* XP Preview */}
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Low</span>
                        <span className={xpAmount >= 100 ? "text-yellow-400" : xpAmount >= 50 ? "text-purple-400" : ""}>
                            {xpAmount < 25 ? "Common reward" : xpAmount < 100 ? "Good reward" : "Premium reward! 🌟"}
                        </span>
                        <span>High</span>
                    </div>
                </div>
            </div>

            {/* Badge (Optional) */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Award Badge <span className="text-gray-500">(optional)</span>
                </label>
                <select
                    value={badgeId || ""}
                    onChange={(e) => setBadgeId(e.target.value || null)}
                    className="select-modern w-full"
                >
                    <option value="">No badge</option>
                    {badges.map((badge) => (
                        <option key={badge.id} value={badge.id}>
                            {badge.icon} {badge.name}
                        </option>
                    ))}
                </select>
                {selectedBadge && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                        <span className="text-2xl">{selectedBadge.icon}</span>
                        <span>Members will receive the <strong className="text-white">{selectedBadge.name}</strong> badge</span>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </p>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className={`
                    btn-primary w-full flex items-center justify-center gap-2
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin">⚙️</span>
                        Creating...
                    </>
                ) : (
                    <>
                        <span>✨</span>
                        Create Rule
                    </>
                )}
            </button>
        </form>
    );
}

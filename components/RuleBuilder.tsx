"use client";

import { useState } from "react";
import { Button } from "@whop/react/components";

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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rule Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rule Name *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Chat Champion Bonus"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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
                    placeholder="Describe what this rule rewards..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                />
            </div>

            {/* Event Type */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trigger Event *
                </label>
                <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                    {eventTypes.map((event) => (
                        <option key={event.value} value={event.value}>
                            {event.label}
                        </option>
                    ))}
                </select>
                {selectedEvent && (
                    <p className="mt-2 text-sm text-gray-500">{selectedEvent.description}</p>
                )}
            </div>

            {/* XP Amount */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    XP to Award *
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="500"
                        value={xpAmount}
                        onChange={(e) => setXpAmount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <input
                        type="number"
                        min="1"
                        max="1000"
                        value={xpAmount}
                        onChange={(e) => setXpAmount(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span className="text-purple-400 font-semibold">XP</span>
                </div>
            </div>

            {/* Badge (Optional) */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Award Badge (optional)
                </label>
                <select
                    value={badgeId || ""}
                    onChange={(e) => setBadgeId(e.target.value || null)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                    <option value="">No badge</option>
                    {badges.map((badge) => (
                        <option key={badge.id} value={badge.id}>
                            {badge.icon} {badge.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Submit */}
            <Button
                type="submit"
                variant="classic"
                size="3"
                className="w-full"
                disabled={isLoading}
            >
                {isLoading ? "Creating..." : "Create Rule"}
            </Button>
        </form>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RuleBuilder } from "@/components/RuleBuilder";
import { RulesList } from "@/components/RulesList";

interface Rule {
    id: string;
    name: string;
    description: string | null;
    eventType: string;
    xpAmount: number;
    isActive: boolean;
    badge: { id: string; name: string; icon: string } | null;
}

interface Badge {
    id: string;
    name: string;
    icon: string;
}

interface EventType {
    value: string;
    label: string;
    description: string;
}

export default function RulesPage() {
    const params = useParams();
    const companyId = params.companyId as string;

    const [rules, setRules] = useState<Rule[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [rulesRes, badgesRes] = await Promise.all([
                fetch(`/api/rules?companyId=${companyId}`),
                fetch(`/api/badges?companyId=${companyId}`),
            ]);

            if (!rulesRes.ok || !badgesRes.ok) {
                throw new Error("Failed to fetch data");
            }

            const rulesData = await rulesRes.json();
            const badgesData = await badgesRes.json();

            setRules(rulesData.rules);
            setEventTypes(rulesData.supportedEventTypes);
            setBadges(badgesData.badges);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateRule = async (ruleData: {
        name: string;
        description: string;
        eventType: string;
        xpAmount: number;
        badgeId: string | null;
    }) => {
        setIsCreating(true);
        try {
            const res = await fetch("/api/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId, ...ruleData }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create rule");
            }

            await fetchData();
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/rules/${ruleId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });

            if (!res.ok) throw new Error("Failed to update rule");

            setRules((prev) =>
                prev.map((r) => (r.id === ruleId ? { ...r, isActive } : r))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        try {
            const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete rule");

            setRules((prev) => prev.filter((r) => r.id !== ruleId));
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⚙️</div>
                    <p className="text-gray-400">Loading rules...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-4xl mb-4">❌</p>
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/dashboard/${companyId}`}
                            className="text-gray-400 hover:text-white text-sm mb-2 inline-block"
                        >
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-white">📜 Gamification Rules</h1>
                        <p className="text-gray-400 mt-1">
                            Create rules to award XP when members take actions
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Rule Form */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">✨ Create New Rule</h2>
                        <RuleBuilder
                            eventTypes={eventTypes}
                            badges={badges}
                            onSubmit={handleCreateRule}
                            isLoading={isCreating}
                        />
                    </div>

                    {/* Existing Rules */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">
                            📋 Active Rules ({rules.filter((r) => r.isActive).length}/{rules.length})
                        </h2>
                        <RulesList
                            rules={rules}
                            onToggle={handleToggleRule}
                            onDelete={handleDeleteRule}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

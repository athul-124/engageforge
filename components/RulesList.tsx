"use client";

import { useState } from "react";

interface Rule {
    id: string;
    name: string;
    description: string | null;
    eventType: string;
    xpAmount: number;
    isActive: boolean;
    badge: { id: string; name: string; icon: string } | null;
}

interface RulesListProps {
    rules: Rule[];
    onToggle: (ruleId: string, isActive: boolean) => Promise<void>;
    onDelete: (ruleId: string) => Promise<void>;
}

const eventTypeLabels: Record<string, { label: string; icon: string }> = {
    "payment.succeeded": { label: "Payment", icon: "💳" },
    "membership.activated": { label: "Membership", icon: "🎫" },
    "membership.deactivated": { label: "Left", icon: "👋" },
    "course.lesson.completed": { label: "Course", icon: "📚" },
    "chat.message.created": { label: "Chat", icon: "💬" },
};

export function RulesList({ rules, onToggle, onDelete }: RulesListProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleToggle = async (rule: Rule) => {
        setLoadingId(rule.id);
        try {
            await onToggle(rule.id, !rule.isActive);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (ruleId: string) => {
        setDeletingId(ruleId);
        try {
            await onDelete(ruleId);
        } finally {
            setDeletingId(null);
        }
    };

    if (rules.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-5xl mb-4 opacity-50 animate-float">📜</div>
                <p className="text-gray-400">No rules created yet.</p>
                <p className="text-gray-500 text-sm mt-1">Create your first rule to start awarding XP!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {rules.map((rule, index) => {
                const eventInfo = eventTypeLabels[rule.eventType] || { label: rule.eventType, icon: "⚡" };
                const isLoading = loadingId === rule.id;
                const isDeleting = deletingId === rule.id;

                return (
                    <div
                        key={rule.id}
                        className={`
                            glass-card p-4 transition-all duration-300 animate-count-up
                            ${rule.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-600 opacity-60'}
                            ${isDeleting ? 'scale-95 opacity-50' : ''}
                        `}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex items-start gap-4">
                            {/* Toggle Switch */}
                            <button
                                onClick={() => handleToggle(rule)}
                                disabled={isLoading}
                                className={`
                                    relative w-12 h-6 rounded-full transition-all duration-300
                                    ${rule.isActive ? 'bg-green-500' : 'bg-gray-600'}
                                    ${isLoading ? 'opacity-50' : 'hover:brightness-110'}
                                `}
                            >
                                <div className={`
                                    absolute top-1 w-4 h-4 rounded-full bg-white shadow-md
                                    transition-all duration-300
                                    ${rule.isActive ? 'left-7' : 'left-1'}
                                    ${isLoading ? 'animate-pulse' : ''}
                                `} />
                            </button>

                            {/* Rule Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-white truncate">{rule.name}</h4>
                                    {rule.badge && (
                                        <span className="text-lg tooltip" data-tooltip={rule.badge.name}>
                                            {rule.badge.icon}
                                        </span>
                                    )}
                                </div>

                                {rule.description && (
                                    <p className="text-sm text-gray-400 truncate mb-2">{rule.description}</p>
                                )}

                                <div className="flex items-center gap-3 text-sm">
                                    {/* Event Type */}
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-700/50 text-gray-300">
                                        <span>{eventInfo.icon}</span>
                                        <span>{eventInfo.label}</span>
                                    </span>

                                    {/* XP Amount */}
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 font-semibold">
                                        <span>+{rule.xpAmount}</span>
                                        <span className="text-purple-400">XP</span>
                                    </span>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(rule.id)}
                                disabled={isDeleting}
                                className={`
                                    p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10
                                    transition-all duration-200
                                    ${isDeleting ? 'animate-spin' : ''}
                                `}
                                title="Delete rule"
                            >
                                {isDeleting ? "⏳" : "🗑️"}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

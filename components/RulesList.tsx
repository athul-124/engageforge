"use client";

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

const eventTypeLabels: Record<string, string> = {
    "payment.succeeded": "💳 Payment",
    "membership.activated": "🎉 Membership",
    "chat.message.created": "💬 Chat",
    "challenge.completed": "🏆 Challenge",
    "content.viewed": "👁️ Content",
    "poll.voted": "📊 Poll",
};

export function RulesList({ rules, onToggle, onDelete }: RulesListProps) {
    if (rules.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📜</p>
                <p>No rules created yet.</p>
                <p className="text-sm">Create your first rule to start gamifying!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {rules.map((rule) => (
                <div
                    key={rule.id}
                    className={`
            p-4 rounded-xl border transition-all duration-200
            ${rule.isActive
                            ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
                            : "bg-gray-800/30 border-gray-700/30 opacity-60"
                        }
          `}
                >
                    <div className="flex items-start gap-4">
                        {/* Toggle */}
                        <button
                            onClick={() => onToggle(rule.id, !rule.isActive)}
                            className={`
                mt-1 w-12 h-6 rounded-full transition-colors relative
                ${rule.isActive ? "bg-purple-500" : "bg-gray-600"}
              `}
                        >
                            <div
                                className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${rule.isActive ? "left-7" : "left-1"}
                `}
                            />
                        </button>

                        {/* Rule Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">{rule.name}</h3>
                                {rule.badge && (
                                    <span className="text-lg" title={rule.badge.name}>
                                        {rule.badge.icon}
                                    </span>
                                )}
                            </div>
                            {rule.description && (
                                <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm px-2 py-1 bg-gray-700/50 rounded text-gray-300">
                                    {eventTypeLabels[rule.eventType] || rule.eventType}
                                </span>
                                <span className="text-sm font-semibold text-purple-400">
                                    +{rule.xpAmount} XP
                                </span>
                            </div>
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => onDelete(rule.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete rule"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

import type { ReactNode } from "react";
import { COLORS } from "@/lib/colors";

interface EmptyStateAction {
    label: string;
    icon?: ReactNode;
    primary?: boolean;
    onClick?: () => void;
}

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description: string;
    actions?: EmptyStateAction[];
}

/**
 * EmptyState — reusable empty state with icon, title, description, and action buttons.
 */
export default function EmptyState({ icon, title, description, actions = [] }: EmptyStateProps) {
    return (
        <div style={{
            background: COLORS.surface,
            borderRadius: 16,
            border: `1px solid ${COLORS.border}`,
            padding: "64px 32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
        }}>
            {icon && <div style={{ marginBottom: 4 }}>{icon}</div>}

            <div>
                <h2 style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 600,
                    margin: "0 0 6px",
                    letterSpacing: "-0.01em",
                    color: COLORS.text,
                }}>{title}</h2>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: COLORS.textMuted,
                    margin: 0,
                    maxWidth: 320,
                    lineHeight: 1.5,
                }}>{description}</p>
            </div>

            {actions.length > 0 && (
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14,
                                fontWeight: 600,
                                color: action.primary ? COLORS.surface : COLORS.accent,
                                background: action.primary ? COLORS.accent : COLORS.accentLight,
                                border: action.primary ? "none" : `1px solid rgba(192,86,33,0.15)`,
                                borderRadius: 10,
                                padding: "12px 24px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                boxShadow: action.primary ? "0 2px 6px rgba(192,86,33,0.2)" : "none",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {action.icon} {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
        <div className="bg-surface rounded-2xl border border-border px-8 py-16 text-center flex flex-col items-center gap-4">
            {icon && <div className="mb-1">{icon}</div>}

            <div>
                <h2 className="font-serif text-xl font-semibold mb-1.5 tracking-tight text-text">
                    {title}
                </h2>
                <p className="font-sans text-sm text-text-muted m-0 max-w-[320px] leading-normal">
                    {description}
                </p>
            </div>

            {actions.length > 0 && (
                <div className="flex gap-2.5 mt-2">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className={cn(
                                "font-sans text-sm font-semibold rounded-[10px] px-6 py-3 cursor-pointer flex items-center gap-[7px] transition-all duration-150",
                                action.primary
                                    ? "text-surface bg-accent border-none shadow-accent"
                                    : "text-accent bg-accent-light border border-accent/15"
                            )}
                        >
                            {action.icon} {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
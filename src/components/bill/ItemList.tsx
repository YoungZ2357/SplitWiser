"use client";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { AvatarStack } from "@/components/ui/Avatar";
import type { BillItem, Participant, ItemAssignment } from "@/types";

function getItemAssignees(
    itemId: string,
    assignments: ItemAssignment[],
    participants: Participant[]
): Participant[] {
    const assignedIds = assignments
        .filter((a) => a.bill_item_id === itemId)
        .map((a) => a.participant_id);
    return participants.filter((p) => assignedIds.includes(p.id));
}

interface ItemListProps {
    items: BillItem[];
    participants: Participant[];
    assignments: ItemAssignment[];
}

export default function ItemList({ items, participants, assignments }: ItemListProps) {
    const participantMap: Record<string, number> = {};
    participants.forEach((p, i) => (participantMap[p.id] = i));

    return (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
            {items.map((item, idx) => {
                const assignees = getItemAssignees(item.id, assignments, participants);
                return (
                    <div
                        key={item.id}
                        className={cn(
                            "flex items-center justify-between px-[18px] py-3 gap-3",
                            idx < items.length - 1 && "border-b border-border"
                        )}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                                {item.name}
                            </div>
                            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                                <AvatarStack participants={assignees} participantMap={participantMap} size={18} />
                                <span>{assignees.map((a) => a.name).join(", ")}</span>
                                {item.is_ai_parsed && (
                                    <span className="text-[10px] font-semibold text-blue bg-[rgba(59,110,190,0.08)] px-[5px] py-px rounded-[3px] tracking-wide">
                                        AI
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="text-sm font-semibold tabular-nums shrink-0">
                            {formatCurrency(item.price)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

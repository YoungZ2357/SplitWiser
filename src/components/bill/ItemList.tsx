// TODO: migrate to Tailwind
"use client";

import { COLORS } from "@/lib/colors";
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
        <div
            style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                overflow: "hidden",
            }}
        >
            {items.map((item, idx) => {
                const assignees = getItemAssignees(item.id, assignments, participants);
                return (
                    <div
                        key={item.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 18px",
                            borderBottom: idx < items.length - 1 ? `1px solid ${COLORS.border}` : "none",
                            gap: 12,
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: COLORS.textMuted,
                                    marginTop: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <AvatarStack participants={assignees} participantMap={participantMap} size={18} />
                                <span>{assignees.map((a) => a.name).join(", ")}</span>
                                {item.is_ai_parsed && (
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: COLORS.blue,
                                            background: "rgba(59,110,190,0.08)",
                                            padding: "1px 5px",
                                            borderRadius: 3,
                                            letterSpacing: "0.03em",
                                        }}
                                    >
                                        AI
                                    </span>
                                )}
                            </div>
                        </div>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                                flexShrink: 0,
                            }}
                        >
                            {formatCurrency(item.price)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

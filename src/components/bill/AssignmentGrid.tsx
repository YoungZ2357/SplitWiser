// TODO: migrate to Tailwind
"use client";

import { COLORS } from "@/lib/colors";
import { Avatar } from "@/components/ui/Avatar";
import type { BillItem, Participant, ItemAssignment } from "@/types";

interface AssignmentGridProps {
    items: BillItem[];
    participants: Participant[];
    assignments: ItemAssignment[];
}

export default function AssignmentGrid({ items, participants, assignments }: AssignmentGridProps) {
    const participantMap: Record<string, number> = {};
    participants.forEach((p, i) => (participantMap[p.id] = i));

    return (
        <div
            style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 18,
                overflowX: "auto",
            }}
        >
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                }}
            >
                <thead>
                    <tr>
                        <th
                            style={{
                                textAlign: "left",
                                padding: "8px 6px",
                                fontWeight: 500,
                                fontSize: 12,
                                color: COLORS.textMuted,
                                borderBottom: `1px solid ${COLORS.border}`,
                            }}
                        >
                            Item
                        </th>
                        {participants.map((p) => (
                            <th
                                key={p.id}
                                style={{
                                    textAlign: "center",
                                    padding: "8px 6px",
                                    fontWeight: 500,
                                    fontSize: 12,
                                    color: COLORS.textMuted,
                                    borderBottom: `1px solid ${COLORS.border}`,
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <Avatar name={p.name} colorIndex={participantMap[p.id]} size={24} />
                                    <span>{p.name}</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, rowIdx) => (
                        <tr key={item.id}>
                            <td
                                style={{
                                    textAlign: "left",
                                    fontWeight: 500,
                                    padding: "10px 6px",
                                    borderBottom: rowIdx < items.length - 1 ? `1px solid ${COLORS.border}` : "none",
                                    maxWidth: 180,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.name}
                            </td>
                            {participants.map((p) => {
                                const assigned = assignments.some(
                                    (a) => a.bill_item_id === item.id && a.participant_id === p.id
                                );
                                return (
                                    <td
                                        key={p.id}
                                        style={{
                                            textAlign: "center",
                                            padding: "10px 6px",
                                            borderBottom: rowIdx < items.length - 1 ? `1px solid ${COLORS.border}` : "none",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: "50%",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 12,
                                                background: assigned ? COLORS.accentLight : COLORS.surfaceAlt,
                                                color: assigned ? COLORS.accent : COLORS.border,
                                            }}
                                        >
                                            {assigned ? "✓" : "–"}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// TODO: migrate to Tailwind
"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
import { formatCurrency } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import type { BillItem, Participant, ItemAssignment, SplitResult } from "@/types";

interface PersonItemDetail {
    id: string;
    name: string;
    price: number;
    sharedWith: number;
    sharePrice: number;
}

function getPersonItems(
    participantId: string,
    items: BillItem[],
    assignments: ItemAssignment[]
): PersonItemDetail[] {
    const assignedItemIds = assignments
        .filter((a) => a.participant_id === participantId)
        .map((a) => a.bill_item_id);
    return items
        .filter((item) => assignedItemIds.includes(item.id))
        .map((item) => {
            const sharedWith = assignments.filter((a) => a.bill_item_id === item.id).length;
            return {
                id: item.id,
                name: item.name,
                price: item.price,
                sharedWith,
                sharePrice: +(item.price / sharedWith).toFixed(2),
            };
        });
}

interface SplitSummaryProps {
    split: SplitResult;
    items: BillItem[];
    participants: Participant[];
    assignments: ItemAssignment[];
}

export default function SplitSummary({ split, items, participants, assignments }: SplitSummaryProps) {
    const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

    const participantMap: Record<string, number> = {};
    participants.forEach((p, i) => (participantMap[p.id] = i));

    return (
        <div>
            {split.per_person.map((person) => {
                const isExpanded = expandedPerson === person.participant_id;
                const personItems = getPersonItems(person.participant_id, items, assignments);
                return (
                    <div
                        key={person.participant_id}
                        style={{
                            background: COLORS.surface,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 10,
                            marginBottom: 10,
                            overflow: "hidden",
                            transition: "box-shadow 0.15s",
                        }}
                    >
                        {/* Person header */}
                        <div
                            onClick={() => setExpandedPerson(isExpanded ? null : person.participant_id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                cursor: "pointer",
                                userSelect: "none",
                            }}
                            data-testid={`person-header-${person.participant_id}`}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <Avatar name={person.participant_name} colorIndex={participantMap[person.participant_id]} />
                                <span style={{ fontWeight: 500, fontSize: 15 }}>{person.participant_name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <span
                                    style={{
                                        fontSize: 17,
                                        fontWeight: 600,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {formatCurrency(person.total)}
                                </span>
                                <span
                                    style={{
                                        fontSize: 18,
                                        color: COLORS.textMuted,
                                        transition: "transform 0.2s",
                                        marginLeft: 8,
                                        display: "inline-flex",
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                            <div
                                style={{
                                    borderTop: `1px solid ${COLORS.border}`,
                                    padding: "14px 18px",
                                    background: COLORS.bg,
                                }}
                                data-testid={`person-detail-${person.participant_id}`}
                            >
                                {personItems.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "6px 0",
                                            fontSize: 13,
                                        }}
                                    >
                                        <div>
                                            <span style={{ color: COLORS.text }}>{item.name}</span>
                                            {item.sharedWith > 1 && (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: COLORS.textMuted,
                                                        background: COLORS.surfaceAlt,
                                                        padding: "1px 6px",
                                                        borderRadius: 4,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    ÷{item.sharedWith}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                                            {formatCurrency(item.sharePrice)}
                                        </span>
                                    </div>
                                ))}
                                <hr
                                    style={{
                                        border: "none",
                                        borderTop: `1px dashed ${COLORS.border}`,
                                        margin: "8px 0",
                                    }}
                                />
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, color: COLORS.textMuted }}>
                                    <span>Items subtotal</span>
                                    <span>{formatCurrency(person.items_subtotal)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, color: COLORS.textMuted }}>
                                    <span>Tax share</span>
                                    <span>{formatCurrency(person.tax_share)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, color: COLORS.textMuted }}>
                                    <span>Tip share</span>
                                    <span>{formatCurrency(person.tip_share)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

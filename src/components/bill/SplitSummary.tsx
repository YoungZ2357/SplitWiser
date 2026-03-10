"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
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
                        className="bg-surface border border-border rounded-[10px] mb-2.5 overflow-hidden transition-shadow duration-150"
                    >
                        {/* Person header */}
                        <div
                            onClick={() => setExpandedPerson(isExpanded ? null : person.participant_id)}
                            className="flex items-center justify-between px-[18px] py-3.5 cursor-pointer select-none"
                            data-testid={`person-header-${person.participant_id}`}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar name={person.participant_name} colorIndex={participantMap[person.participant_id]} />
                                <span className="font-medium text-[15px]">{person.participant_name}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-[17px] font-semibold tabular-nums">
                                    {formatCurrency(person.total)}
                                </span>
                                <span
                                    className="text-lg text-text-muted ml-2 inline-flex transition-transform duration-200"
                                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
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
                                className="border-t border-border px-[18px] py-3.5 bg-bg"
                                data-testid={`person-detail-${person.participant_id}`}
                            >
                                {personItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-center py-1.5 text-[13px]"
                                    >
                                        <div>
                                            <span className="text-text">{item.name}</span>
                                            {item.sharedWith > 1 && (
                                                <span className="text-[11px] text-text-muted bg-surface-alt px-1.5 py-px rounded ml-2">
                                                    ÷{item.sharedWith}
                                                </span>
                                            )}
                                        </div>
                                        <span className="tabular-nums font-medium">
                                            {formatCurrency(item.sharePrice)}
                                        </span>
                                    </div>
                                ))}
                                <hr className="border-none border-t border-dashed border-border my-2" />
                                <div className="flex justify-between py-[3px] text-xs text-text-muted">
                                    <span>Items subtotal</span>
                                    <span>{formatCurrency(person.items_subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-[3px] text-xs text-text-muted">
                                    <span>Tax share</span>
                                    <span>{formatCurrency(person.tax_share)}</span>
                                </div>
                                <div className="flex justify-between py-[3px] text-xs text-text-muted">
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

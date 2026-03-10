"use client";

import { cn } from "@/lib/cn";
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
        <div className="bg-surface border border-border rounded-[10px] p-[18px] overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
                <thead>
                    <tr>
                        <th className="text-left px-1.5 py-2 font-medium text-xs text-text-muted border-b border-border">
                            Item
                        </th>
                        {participants.map((p) => (
                            <th
                                key={p.id}
                                className="text-center px-1.5 py-2 font-medium text-xs text-text-muted border-b border-border"
                            >
                                <div className="flex flex-col items-center gap-1">
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
                                className={cn(
                                    "text-left font-medium px-1.5 py-2.5 max-w-[180px] truncate",
                                    rowIdx < items.length - 1 && "border-b border-border"
                                )}
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
                                        className={cn(
                                            "text-center px-1.5 py-2.5",
                                            rowIdx < items.length - 1 && "border-b border-border"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "w-5 h-5 rounded-full inline-flex items-center justify-center text-xs",
                                                assigned
                                                    ? "bg-accent-light text-accent"
                                                    : "bg-surface-alt text-border"
                                            )}
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

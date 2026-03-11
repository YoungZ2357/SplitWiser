"use client";

import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency } from "@/lib/format";
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
        <div className="bg-surface border border-border rounded-[10px] p-4 sm:p-[18px]">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Cards */}
            <div className="flex flex-col gap-3 md:hidden">
                {items.map((item) => {
                    const assignedToItem = assignments.filter((a) => a.bill_item_id === item.id);
                    const allSelected = assignedToItem.length === participants.length && participants.length > 0;

                    return (
                        <div key={item.id} className="bg-surface-alt rounded-lg border border-border p-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-serif text-[15px] font-semibold text-text truncate pr-2">
                                    {item.name}
                                </span>
                                <span className="font-sans text-[14px] font-medium text-text-muted shrink-0">
                                    {formatCurrency(item.price)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {/* Select All Toggle (Read-only visual) */}
                                <label className="flex items-center gap-3 p-1.5 rounded-md cursor-default pointer-events-none">
                                    <input 
                                        type="checkbox" 
                                        checked={allSelected} 
                                        readOnly 
                                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                    />
                                    <span className={cn("font-sans text-[13.5px] font-medium", allSelected ? "text-text" : "text-text-muted")}>
                                        Select All
                                    </span>
                                </label>
                                
                                <div className="h-px bg-border my-0.5 mx-1" />
                                
                                {participants.map((p) => {
                                    const assigned = assignedToItem.some((a) => a.participant_id === p.id);
                                    return (
                                        <label key={p.id} className="flex items-center gap-3 p-1.5 rounded-md cursor-default pointer-events-none">
                                            <input 
                                                type="checkbox" 
                                                checked={assigned} 
                                                readOnly 
                                                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Avatar name={p.name} colorIndex={participantMap[p.id]} size={20} />
                                                <span className={cn("font-sans text-[13.5px]", assigned ? "text-text" : "text-text-muted")}>
                                                    {p.name}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

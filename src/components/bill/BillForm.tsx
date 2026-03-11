"use client";

import { useReducer, useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { format, parse } from "date-fns";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { BillDetail, CreateBillRequest, UpdateBillRequest } from "@/types";

// ═══════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════

interface FormItem {
    name: string;
    price: number;
    is_ai_parsed: boolean;
    confidence?: "high" | "medium" | "low";
}

interface BillFormState {
    step: number; // 0–4 expanded, -1 collapsed
    title: string;
    date: string; // "YYYY-MM-DD"
    receipt_image_url: string | null;
    inputMethod: "manual" | "receipt" | null;
    items: FormItem[];
    tax: number;
    tip: number;
    participants: { name: string }[];
    assignments: Record<number, number[]>;
    // item_index → participant_indices[]
    // PRD specifies Map<number, Set<number>>, but Record<number, number[]> used
    // for JSON compat. TOGGLE_ASSIGNMENT enforces uniqueness via includes().
    submitting: boolean;
    error: string | null;
}

type FormAction =
    | { type: "SET_FIELD"; field: string; value: unknown }
    | { type: "SET_STEP"; step: number }
    | { type: "ADD_ITEM"; item: FormItem }
    | { type: "UPDATE_ITEM"; index: number; field: "name" | "price"; value: string | number }
    | { type: "REMOVE_ITEM"; index: number }
    | { type: "ADD_PARTICIPANT"; name: string }
    | { type: "REMOVE_PARTICIPANT"; index: number }
    | { type: "TOGGLE_ASSIGNMENT"; itemIndex: number; participantIndex: number }
    | { type: "TOGGLE_ALL_ASSIGNMENT"; itemIndex: number }
    | { type: "RESET" };

export interface BillFormProps {
    mode: "create" | "edit";
    initialData?: BillDetail;
    onSubmitSuccess: (billId: string) => void;
}

// ═══════════════════════════════════════════════════
//  BillDetail → BillFormState mapping (for edit mode)
// ═══════════════════════════════════════════════════

export function mapBillDetailToFormState(data: BillDetail): BillFormState {
    const items: FormItem[] = data.items.map((i) => ({
        name: i.name,
        price: i.price,
        is_ai_parsed: i.is_ai_parsed,
    }));

    const assignments: Record<number, number[]> = {};
    data.items.forEach((item, ii) => {
        const participantIndices = data.assignments
            .filter((a) => a.bill_item_id === item.id)
            .map((a) => data.participants.findIndex((p) => p.id === a.participant_id))
            .filter((idx) => idx >= 0);
        assignments[ii] = participantIndices;
    });

    return {
        step: -1,
        title: data.bill.title,
        date: data.bill.date,
        receipt_image_url: data.bill.receipt_image_url,
        inputMethod: "manual",
        items,
        tax: data.bill.tax,
        tip: data.bill.tip,
        participants: data.participants.map((p) => ({ name: p.name })),
        assignments,
        submitting: false,
        error: null,
    };
}

// ═══════════════════════════════════════════════════
//  Reducer
// ═══════════════════════════════════════════════════

const EMPTY_STATE: BillFormState = {
    step: 0,
    title: "",
    date: new Date().toISOString().slice(0, 10),
    receipt_image_url: null,
    inputMethod: null,
    items: [],
    tax: 0,
    tip: 0,
    participants: [],
    assignments: {},
    submitting: false,
    error: null,
};

function reducer(state: BillFormState, action: FormAction): BillFormState {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, [action.field]: action.value };

        case "SET_STEP":
            return { ...state, step: state.step === action.step ? -1 : action.step };

        case "ADD_ITEM": {
            const newItems = [...state.items, action.item];
            const newIdx = newItems.length - 1;
            const allParticipants = state.participants.map((_, i) => i);
            return {
                ...state,
                items: newItems,
                assignments: { ...state.assignments, [newIdx]: allParticipants },
            };
        }

        case "UPDATE_ITEM": {
            const items = state.items.map((item, i) =>
                i === action.index ? { ...item, [action.field]: action.value } : item
            );
            return { ...state, items };
        }

        case "REMOVE_ITEM": {
            const items = state.items.filter((_, i) => i !== action.index);
            const newAssignments: Record<number, number[]> = {};
            Object.entries(state.assignments).forEach(([key, val]) => {
                const k = Number(key);
                if (k < action.index) newAssignments[k] = val;
                else if (k > action.index) newAssignments[k - 1] = val;
            });
            return { ...state, items, assignments: newAssignments };
        }

        case "ADD_PARTICIPANT": {
            const participants = [...state.participants, { name: action.name }];
            const newParticipantIdx = participants.length - 1;
            const newAssignments = { ...state.assignments };
            Object.keys(newAssignments).forEach((key) => {
                const k = Number(key);
                newAssignments[k] = [...newAssignments[k], newParticipantIdx];
            });
            return { ...state, participants, assignments: newAssignments };
        }

        case "REMOVE_PARTICIPANT": {
            const participants = state.participants.filter((_, i) => i !== action.index);
            const newAssignments: Record<number, number[]> = {};
            Object.entries(state.assignments).forEach(([key, val]) => {
                const k = Number(key);
                newAssignments[k] = val
                    .filter((pi) => pi !== action.index)
                    .map((pi) => (pi > action.index ? pi - 1 : pi));
            });
            return { ...state, participants, assignments: newAssignments };
        }

        case "TOGGLE_ASSIGNMENT": {
            const current = state.assignments[action.itemIndex] || [];
            const next = current.includes(action.participantIndex)
                ? current.filter((pi) => pi !== action.participantIndex)
                : [...current, action.participantIndex];
            return {
                ...state,
                assignments: { ...state.assignments, [action.itemIndex]: next },
            };
        }

        case "TOGGLE_ALL_ASSIGNMENT": {
            const current = state.assignments[action.itemIndex] || [];
            const allSelected = current.length === state.participants.length;
            const next = allSelected ? [] : state.participants.map((_, i) => i);
            return {
                ...state,
                assignments: { ...state.assignments, [action.itemIndex]: next },
            };
        }

        case "RESET":
            return { ...EMPTY_STATE };

        default:
            return state;
    }
}

// ═══════════════════════════════════════════════════
//  Client-side split preview (preview only)
// ═══════════════════════════════════════════════════

interface SplitPreview {
    per_person: {
        participant_name: string;
        items_subtotal: number;
        tax_share: number;
        tip_share: number;
        total: number;
    }[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
}

function calcSplit(
    items: FormItem[],
    participants: { name: string }[],
    assignments: Record<number, number[]>,
    tax: number,
    tip: number
): SplitPreview | null {
    if (!items.length || !participants.length) return null;
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    const perPerson = participants.map((p, pi) => {
        let itemsSubtotal = 0;
        items.forEach((item, ii) => {
            const assigned = assignments[ii] || [];
            const all = assigned.length === 0 ? participants.map((_, i) => i) : assigned;
            if (all.includes(pi)) itemsSubtotal += item.price / all.length;
        });
        const ratio = subtotal > 0 ? itemsSubtotal / subtotal : 1 / participants.length;
        const taxShare = tax * ratio;
        const tipShare = tip * ratio;
        return {
            participant_name: p.name,
            items_subtotal: +itemsSubtotal.toFixed(2),
            tax_share: +taxShare.toFixed(2),
            tip_share: +tipShare.toFixed(2),
            total: +(itemsSubtotal + taxShare + tipShare).toFixed(2),
        };
    });
    return {
        per_person: perPerson,
        subtotal: +subtotal.toFixed(2),
        tax,
        tip,
        total: +(subtotal + tax + tip).toFixed(2),
    };
}

// ═══════════════════════════════════════════════════
//  Micro components
// ═══════════════════════════════════════════════════

const PARTICIPANT_TEXT = ["text-accent", "text-green", "text-red", "text-blue", "text-[#92700C]", "text-[#7B61A0]"];
const PARTICIPANT_BG = ["bg-accent-light", "bg-green-light", "bg-red-light", "bg-[rgba(59,110,190,0.08)]", "bg-[rgba(146,112,12,0.08)]", "bg-[rgba(123,97,160,0.08)]"];
const PARTICIPANT_BORDER = ["border-accent", "border-green", "border-red", "border-blue", "border-[#92700C]", "border-[#7B61A0]"];

function ConfidenceBadge({ confidence }: { confidence?: string }) {
    if (!confidence || confidence === "high") return null;
    const isLow = confidence === "low";
    return (
        <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-[10px] font-sans font-semibold tracking-wide",
            isLow
                ? "bg-red-light text-red"
                : "bg-[rgba(251,191,36,0.12)] text-[#92700C]"
        )}>{isLow ? "LOW" : "MED"}</span>
    );
}

// ═══════════════════════════════════════════════════
//  DatePicker (react-day-picker + date-fns)
// ═══════════════════════════════════════════════════

function DatePickerField({
    value,
    onChange,
}: {
    value: string; // "YYYY-MM-DD"
    onChange: (dateStr: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
    const displayText = selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date";

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                data-testid="date-picker-trigger"
                className={cn(
                    "w-full bg-surface border border-border rounded-[10px] px-3.5 py-[11px] font-sans text-sm cursor-pointer text-left flex items-center justify-between",
                    selectedDate ? "text-text" : "text-text-muted"
                )}
            >
                <span>{displayText}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </button>
            {open && (
                <>
                    {/* Click-away overlay */}
                    <div
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-[99]"
                        data-testid="date-picker-overlay"
                    />
                    <div className="absolute top-[calc(100%+4px)] left-0 z-[100] bg-surface border border-border rounded-xl shadow-[0_8px_24px_rgba(26,23,20,0.12)] p-3">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={(day) => {
                                if (day) {
                                    onChange(format(day, "yyyy-MM-dd"));
                                }
                                setOpen(false);
                            }}
                            styles={{
                                month_caption: {
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontSize: 15, fontWeight: 600, color: "var(--color-text)",
                                },
                                weekday: {
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 11, color: "var(--color-text-muted)",
                                },
                                day_button: {
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13, borderRadius: 8,
                                    width: 36, height: 36, border: "none",
                                    cursor: "pointer",
                                },
                                today: {
                                    fontWeight: 700, color: "var(--color-accent)",
                                },
                                selected: {
                                    background: "var(--color-accent)",
                                    color: "#fff",
                                    borderRadius: 8,
                                },
                                chevron: {
                                    fill: "var(--color-text-muted)",
                                },
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════

export default function BillForm({ mode, initialData, onSubmitSuccess }: BillFormProps) {
    const router = useRouter();
    const initial = initialData ? mapBillDetailToFormState(initialData) : EMPTY_STATE;
    const [state, dispatch] = useReducer(reducer, initial);

    const { step, title, date, items, tax, tip, participants, assignments, submitting, error } = state;

    // ── Derived ──
    const subtotal = useMemo(() => items.reduce((s, i) => s + i.price, 0), [items]);
    const split = useMemo(
        () => calcSplit(items, participants, assignments, tax, tip),
        [items, participants, assignments, tax, tip]
    );

    const isDirty = useMemo(() => {
        return title !== initial.title
            || date !== initial.date
            || items.length !== initial.items.length
            || participants.length !== initial.participants.length
            || tax !== initial.tax
            || tip !== initial.tip
            || state.inputMethod !== initial.inputMethod;
    }, [title, date, items.length, participants.length, tax, tip, state.inputMethod, initial]);

    // ── Section metadata ──
    const sections = [
        { key: 0, title: "Input Method", done: state.inputMethod !== null },
        { key: 1, title: "Items", done: items.length > 0, count: items.length || undefined },
        { key: 2, title: "Participants", done: participants.length >= 2, count: participants.length || undefined },
        { key: 3, title: "Assignment", done: Object.values(assignments).some((a) => a.length > 0) },
        { key: 4, title: "Review", done: false },
    ];

    // ── Handlers ──
    const handleClose = useCallback(() => {
        if (isDirty) {
            if (!window.confirm("You have unsaved changes. Leave anyway?")) return;
        }
        router.push("/dashboard");
    }, [isDirty, router]);

    const handleSubmit = useCallback(async () => {
        // Validation
        if (!title.trim()) {
            dispatch({ type: "SET_FIELD", field: "error", value: "Title is required." });
            return;
        }
        if (items.length === 0) {
            dispatch({ type: "SET_FIELD", field: "error", value: "Add at least one item." });
            return;
        }
        if (participants.length < 2) {
            dispatch({ type: "SET_FIELD", field: "error", value: "Add at least 2 participants." });
            return;
        }
        const unassigned = items.findIndex((_, ii) => !assignments[ii] || assignments[ii].length === 0);
        if (unassigned >= 0) {
            dispatch({ type: "SET_FIELD", field: "error", value: `"${items[unassigned].name}" has no one assigned.` });
            return;
        }

        dispatch({ type: "SET_FIELD", field: "submitting", value: true });
        dispatch({ type: "SET_FIELD", field: "error", value: null });

        // Build assignment array
        const assignmentInputs: { item_index: number; participant_index: number }[] = [];
        Object.entries(assignments).forEach(([itemIdx, pIndices]) => {
            pIndices.forEach((pi) => {
                assignmentInputs.push({ item_index: Number(itemIdx), participant_index: pi });
            });
        });

        try {
            if (mode === "create") {
                const body: CreateBillRequest = {
                    title: title.trim(), date, tax, tip,
                    items: items.map((i) => ({ name: i.name, price: i.price, is_ai_parsed: i.is_ai_parsed })),
                    participants: participants.map((p) => ({ name: p.name })),
                    assignments: assignmentInputs,
                };
                const res = await fetch("/api/bills", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    dispatch({ type: "SET_FIELD", field: "error", value: "Failed to create bill. Please try again." });
                    return;
                }
                const data = await res.json();
                onSubmitSuccess(data.bill?.id ?? "new-bill-id");
            } else {
                const billId = initialData!.bill.id;
                const body: UpdateBillRequest = {
                    title: title.trim(), date, tax, tip,
                    items: items.map((i) => ({ name: i.name, price: i.price, is_ai_parsed: i.is_ai_parsed })),
                    participants: participants.map((p) => ({ name: p.name })),
                    assignments: assignmentInputs,
                };
                const res = await fetch(`/api/bills/${billId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    dispatch({ type: "SET_FIELD", field: "error", value: "Failed to update bill. Please try again." });
                    return;
                }
                onSubmitSuccess(billId);
            }
        } catch {
            dispatch({ type: "SET_FIELD", field: "error", value: "Network error. Please check your connection." });
        } finally {
            dispatch({ type: "SET_FIELD", field: "submitting", value: false });
        }
    }, [mode, title, date, tax, tip, items, participants, assignments, initialData, onSubmitSuccess]);

    // ── Participant add handler ──
    const handleAddParticipant = useCallback((name: string) => {
        if (name.trim()) {
            dispatch({ type: "ADD_PARTICIPANT", name: name.trim() });
        }
    }, []);

    // ═══════════════════════════════════════════════════
    //  Render
    // ═══════════════════════════════════════════════════

    const labelCls = "font-sans text-[11px] text-text-muted block mb-1 uppercase tracking-widest";
    const inputCls = "bg-surface border border-border rounded-[10px] px-3.5 py-[11px] font-serif text-[15px] text-text outline-none w-full";

    return (
        <div className="max-w-[720px] mx-auto pb-10">
            {/* ── Header ── */}
            <div className="pt-5 px-6 pb-4 flex justify-between items-center">
                <div>
                    <div className="font-sans text-xs text-text-muted tracking-widest uppercase">
                        {mode === "edit" ? "Edit" : "Create"}
                    </div>
                    <h1 className="font-serif text-[26px] text-text mt-1 font-bold">
                        {mode === "edit" ? "Edit Bill" : "New Bill"}
                    </h1>
                </div>
                <button
                    onClick={handleClose}
                    aria-label="Close"
                    data-testid="close-button"
                    className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center cursor-pointer font-sans text-lg text-text-muted"
                >×</button>
            </div>

            {/* ── Title + Date ── */}
            <div className="px-6 pb-5 flex gap-3">
                <div className="flex-[2]">
                    <label className={labelCls}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })}
                        placeholder="e.g. Costco Run March 1"
                        className={inputCls}
                        data-testid="title-input"
                    />
                </div>
                <div className="flex-1">
                    <label className={labelCls}>Date</label>
                    <DatePickerField
                        value={date}
                        onChange={(d) => dispatch({ type: "SET_FIELD", field: "date", value: d })}
                    />
                </div>
            </div>

            {/* ── Accordion ── */}
            <div className="mx-6 border border-border rounded-2xl overflow-hidden bg-surface">
                {sections.map((sec) => (
                    <div key={sec.key}>
                        {/* Section Header */}
                        <button
                            onClick={() => dispatch({ type: "SET_STEP", step: sec.key })}
                            data-testid={`section-header-${sec.key}`}
                            className={cn(
                                "w-full flex items-center justify-between px-5 py-4 border-t-0 border-l-0 border-r-0 border-b border-border cursor-pointer",
                                step === sec.key ? "bg-surface" : "bg-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "w-7 h-7 rounded-full inline-flex items-center justify-center text-[13px] font-sans",
                                    (sec.done || step === sec.key)
                                        ? "bg-accent text-white"
                                        : "bg-surface-alt text-text-muted"
                                )}>{sec.done ? "✓" : sec.key + 1}</span>
                                <span className={cn(
                                    "font-serif text-[15px]",
                                    step === sec.key
                                        ? "text-text font-semibold"
                                        : "text-text-muted font-normal"
                                )}>{sec.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {sec.count != null && (
                                    <span className="font-sans text-xs text-text-muted bg-surface-alt px-2.5 py-0.5 rounded-[10px]">
                                        {sec.count}
                                    </span>
                                )}
                                <span
                                    className="text-text-muted text-sm inline-block transition-transform duration-200"
                                    style={{ transform: step === sec.key ? "rotate(180deg)" : "rotate(0)" }}
                                >▾</span>
                            </div>
                        </button>

                        {/* Section Body */}
                        {step === sec.key && (
                            <div className="px-5 py-4 bg-bg border-b border-border">
                                {sec.key === 0 && <InputMethodSection state={state} dispatch={dispatch} />}
                                {sec.key === 1 && (
                                    <ItemsSection
                                        items={items} tax={tax} tip={tip}
                                        subtotal={subtotal} dispatch={dispatch}
                                    />
                                )}
                                {sec.key === 2 && (
                                    <ParticipantsSection
                                        participants={participants}
                                        dispatch={dispatch}
                                        onAdd={handleAddParticipant}
                                    />
                                )}
                                {sec.key === 3 && (
                                    <AssignmentSection
                                        items={items} participants={participants}
                                        assignments={assignments} dispatch={dispatch}
                                    />
                                )}
                                {sec.key === 4 && (
                                    <ReviewSection split={split} dispatch={dispatch} />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Error ── */}
            {error && (
                <div role="alert" className="mx-6 mt-3 px-3.5 py-2.5 rounded-[10px] bg-red-light text-red font-sans text-[13px]">
                    {error}
                </div>
            )}

            {/* ── Bottom CTA ── */}
            <div className="px-6 pt-6">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    data-testid="submit-button"
                    className={cn(
                        "w-full py-4 rounded-[14px] border-none text-white font-serif text-base font-semibold shadow-green transition-all duration-150",
                        submitting
                            ? "bg-text-muted cursor-not-allowed"
                            : "bg-green cursor-pointer"
                    )}
                >{submitting ? "Saving…" : "Save & Share Bill"}</button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
//  Section Sub-components
// ═══════════════════════════════════════════════════

// ── Input Method ──
function InputMethodSection({
    state, dispatch,
}: {
    state: BillFormState;
    dispatch: React.Dispatch<FormAction>;
}) {
    return (
        <div className="flex gap-2.5">
            {([
                { label: "📷 Upload Receipt", value: "receipt" as const },
                { label: "✏️ Enter Manually", value: "manual" as const },
            ]).map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => {
                        dispatch({ type: "SET_FIELD", field: "inputMethod", value: opt.value });
                        if (opt.value === "manual") dispatch({ type: "SET_STEP", step: 1 });
                    }}
                    data-testid={`input-method-${opt.value}`}
                    className={cn(
                        "flex-1 py-3.5 rounded-[10px] text-center font-sans text-[13px] cursor-pointer",
                        state.inputMethod === opt.value
                            ? "bg-accent-light border border-accent text-accent font-semibold"
                            : "bg-surface border border-border text-text-muted font-normal"
                    )}
                >{opt.label}</button>
            ))}
        </div>
    );
}

// ── Items ──
function ItemsSection({
    items, tax, tip, subtotal, dispatch,
}: {
    items: FormItem[];
    tax: number;
    tip: number;
    subtotal: number;
    dispatch: React.Dispatch<FormAction>;
}) {
    return (
        <div className="flex flex-col gap-2">
            {items.map((item, i) => (
                <div key={i} className={cn(
                    "flex items-center gap-2 px-3.5 py-2.5 bg-surface rounded-[10px] border",
                    item.confidence === "low" ? "border-[rgba(190,59,59,0.3)]"
                        : item.confidence === "medium" ? "border-[rgba(251,191,36,0.4)]"
                            : "border-border"
                )}>
                    <div className="flex-[2] flex items-center gap-2">
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => dispatch({
                                type: "UPDATE_ITEM", index: i,
                                field: "name", value: e.target.value,
                            })}
                            placeholder="Item name"
                            data-testid={`item-name-${i}`}
                            className="border-none bg-transparent outline-none font-serif text-sm text-text w-full"
                        />
                        <ConfidenceBadge confidence={item.confidence} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-sans text-sm text-text-muted">$</span>
                        <input
                            type="number"
                            value={item.price || ""}
                            onChange={(e) => dispatch({
                                type: "UPDATE_ITEM", index: i,
                                field: "price",
                                value: parseFloat(e.target.value) || 0,
                            })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            data-testid={`item-price-${i}`}
                            className="border-none bg-transparent outline-none font-sans text-sm font-semibold text-text w-[60px] text-right"
                        />
                        <button
                            onClick={() => dispatch({ type: "REMOVE_ITEM", index: i })}
                            aria-label={`Remove ${item.name || "item"}`}
                            className="bg-transparent border-none cursor-pointer text-text-muted text-sm px-0.5"
                        >×</button>
                    </div>
                </div>
            ))}

            <button
                onClick={() => dispatch({
                    type: "ADD_ITEM",
                    item: { name: "", price: 0, is_ai_parsed: false },
                })}
                data-testid="add-item-button"
                className="py-2.5 rounded-[10px] border-[1.5px] border-dashed border-border bg-transparent font-sans text-[13px] text-accent cursor-pointer"
            >+ Add Item</button>

            {/* Tax / Tip / Subtotal row */}
            <div className="flex gap-2.5 mt-1">
                <div className="flex-1">
                    <div className="bg-surface rounded-[10px] border border-border px-3 py-2.5">
                        <span className="font-sans text-[11px] text-text-muted">Tax</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="font-sans text-sm text-text-muted">$</span>
                            <input
                                type="number"
                                value={tax || ""}
                                onChange={(e) => dispatch({
                                    type: "SET_FIELD", field: "tax",
                                    value: parseFloat(e.target.value) || 0,
                                })}
                                min="0" step="0.01"
                                data-testid="tax-input"
                                className="border-none bg-transparent outline-none font-sans text-sm text-text w-full"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="bg-surface rounded-[10px] border border-border px-3 py-2.5">
                        <span className="font-sans text-[11px] text-text-muted">Tip</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="font-sans text-sm text-text-muted">$</span>
                            <input
                                type="number"
                                value={tip || ""}
                                onChange={(e) => dispatch({
                                    type: "SET_FIELD", field: "tip",
                                    value: parseFloat(e.target.value) || 0,
                                })}
                                min="0" step="0.01"
                                data-testid="tip-input"
                                className="border-none bg-transparent outline-none font-sans text-sm text-text w-full"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="bg-accent-light rounded-[10px] px-3 py-2.5">
                        <span className="font-sans text-[11px] text-text-muted">Subtotal</span>
                        <div className="font-serif text-[15px] font-bold text-accent mt-0.5" data-testid="subtotal">
                            {formatCurrency(subtotal)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Participants ──
function ParticipantsSection({
    participants, dispatch, onAdd,
}: {
    participants: { name: string }[];
    dispatch: React.Dispatch<FormAction>;
    onAdd: (name: string) => void;
}) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const input = e.currentTarget;
            onAdd(input.value);
            input.value = "";
        }
    };

    const handleAddClick = () => {
        const input = document.getElementById(
            "new-participant-input"
        ) as HTMLInputElement | null;
        if (input) {
            onAdd(input.value);
            input.value = "";
            input.focus();
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {participants.length < 2 && (
                <div
                    className="px-3 py-2 rounded-lg bg-[rgba(251,191,36,0.12)] text-[#92700C] font-sans text-xs"
                    data-testid="min-participants-warning"
                >
                    At least 2 participants are required
                </div>
            )}

            {participants.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3.5 py-2.5 bg-surface rounded-[10px] border border-border">
                    <div className="flex items-center gap-2.5">
                        <div className={cn(
                            "w-[30px] h-[30px] rounded-full flex items-center justify-center font-serif text-[13px] font-semibold",
                            PARTICIPANT_BG[i % PARTICIPANT_BG.length],
                            PARTICIPANT_TEXT[i % PARTICIPANT_TEXT.length]
                        )}>{p.name[0]?.toUpperCase() ?? "?"}</div>
                        <span className="font-serif text-sm text-text">{p.name}</span>
                    </div>
                    <button
                        onClick={() => dispatch({
                            type: "REMOVE_PARTICIPANT", index: i,
                        })}
                        aria-label={`Remove ${p.name}`}
                        className="bg-transparent border-none cursor-pointer text-text-muted text-sm"
                    >×</button>
                </div>
            ))}

            {/* Add input */}
            <div className="flex gap-2">
                <input
                    id="new-participant-input"
                    type="text"
                    placeholder="Name"
                    onKeyDown={handleKeyDown}
                    data-testid="participant-name-input"
                    className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-border bg-surface font-serif text-sm text-text outline-none"
                />
                <button
                    onClick={handleAddClick}
                    data-testid="add-participant-button"
                    className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-dashed border-border bg-transparent font-sans text-[13px] text-accent cursor-pointer whitespace-nowrap"
                >+ Add Person</button>
            </div>
        </div>
    );
}

// ── Assignment ──
function AssignmentSection({
    items, participants, assignments, dispatch,
}: {
    items: FormItem[];
    participants: { name: string }[];
    assignments: Record<number, number[]>;
    dispatch: React.Dispatch<FormAction>;
}) {
    return (
        <div className="flex flex-col gap-2.5">
            {items.map((item, ii) => {
                const assigned = assignments[ii] || [];
                const allSelected =
                    assigned.length === participants.length && participants.length > 0;
                return (
                    <div key={ii} className="bg-surface rounded-xl p-3.5 border border-border">
                        <div className="flex justify-between mb-2">
                            <span className="font-serif text-sm text-text">{item.name || "(unnamed)"}</span>
                            <span className="font-sans text-[13px] text-text-muted">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {/* "Everyone" chip */}
                            <button
                                onClick={() => dispatch({
                                    type: "TOGGLE_ALL_ASSIGNMENT", itemIndex: ii,
                                })}
                                data-testid={`everyone-chip-${ii}`}
                                className={cn(
                                    "px-3.5 py-[5px] rounded-[20px] text-[13px] font-serif cursor-pointer transition-all duration-200 border-[1.5px]",
                                    allSelected
                                        ? "border-accent bg-accent-light text-accent font-semibold"
                                        : "border-border bg-transparent text-text-muted font-normal"
                                )}
                            >Everyone</button>

                            {participants.map((p, pi) => {
                                const active = assigned.includes(pi);
                                return (
                                    <button
                                        key={pi}
                                        onClick={() => dispatch({
                                            type: "TOGGLE_ASSIGNMENT",
                                            itemIndex: ii, participantIndex: pi,
                                        })}
                                        data-testid={`assignment-chip-${ii}-${pi}`}
                                        className={cn(
                                            "px-3.5 py-[5px] rounded-[20px] text-[13px] font-serif cursor-pointer transition-all duration-200 border-[1.5px]",
                                            active
                                                ? cn(PARTICIPANT_BORDER[pi % PARTICIPANT_BORDER.length], PARTICIPANT_BG[pi % PARTICIPANT_BG.length], PARTICIPANT_TEXT[pi % PARTICIPANT_TEXT.length], "font-semibold")
                                                : "border-border bg-transparent text-text-muted font-normal"
                                        )}
                                    >{p.name}</button>
                                );
                            })}
                        </div>
                        {assigned.length > 0 && (
                            <div className="font-sans text-xs text-text-muted mt-2" data-testid={`per-person-cost-${ii}`}>
                                {formatCurrency(item.price / assigned.length)} / person
                            </div>
                        )}
                    </div>
                );
            })}
            {items.length === 0 && (
                <div className="font-sans text-[13px] text-text-muted text-center py-5">
                    Add items first to assign participants.
                </div>
            )}
        </div>
    );
}

// ── Review ──
function ReviewSection({
    split, dispatch,
}: {
    split: SplitPreview | null;
    dispatch: React.Dispatch<FormAction>;
}) {
    if (!split) {
        return (
            <div className="font-sans text-[13px] text-text-muted text-center py-5">
                Complete the previous steps to see the split preview.
            </div>
        );
    }

    const editLinkCls = "font-sans text-xs font-medium text-accent bg-transparent border-none cursor-pointer underline p-0";

    return (
        <div>
            {/* Edit links */}
            <div className="flex gap-3 mb-3 font-sans text-xs text-text-muted">
                <span>Quick edit:</span>
                <button onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
                    className={editLinkCls} data-testid="review-edit-items">
                    Items
                </button>
                <button onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
                    className={editLinkCls} data-testid="review-edit-participants">
                    Participants
                </button>
                <button onClick={() => dispatch({ type: "SET_STEP", step: 3 })}
                    className={editLinkCls} data-testid="review-edit-assignments">
                    Assignments
                </button>
            </div>

            {/* Per-person cards */}
            {split.per_person.map((p, i) => (
                <div key={i} className="bg-surface rounded-xl px-4 py-3.5 border border-border mb-2">
                    <div className="flex justify-between items-center">
                        <span className="font-serif text-[15px] text-text">{p.participant_name}</span>
                        <span className="font-serif text-[17px] font-bold text-accent">{formatCurrency(p.total)}</span>
                    </div>
                    <div className="font-sans text-xs text-text-muted mt-1.5">
                        Items {formatCurrency(p.items_subtotal)} ·
                        Tax {formatCurrency(p.tax_share)} ·
                        Tip {formatCurrency(p.tip_share)}
                    </div>
                </div>
            ))}

            {/* Grand total */}
            <div className="mt-3 px-4 py-3.5 bg-accent-light rounded-xl flex justify-between">
                <span className="font-serif text-[15px] text-text">Grand Total</span>
                <span className="font-serif text-lg font-bold text-accent" data-testid="grand-total">
                    {formatCurrency(split.total)}
                </span>
            </div>

            {/* Rounding disclaimer */}
            <div className="font-sans text-[11px] text-text-muted mt-2 text-center italic">
                Final amounts are calculated on save and may differ by a few
                cents due to rounding.
            </div>
        </div>
    );
}

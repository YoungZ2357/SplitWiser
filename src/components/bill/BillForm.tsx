"use client";

import { useReducer, useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { format, parse } from "date-fns";
import { COLORS } from "@/lib/colors";
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

const PARTICIPANT_COLORS = [COLORS.accent, COLORS.green, COLORS.red, COLORS.blue, "#92700C", "#7B61A0"];
const PARTICIPANT_BG = [
    COLORS.accentLight, COLORS.greenLight, COLORS.redLight,
    "rgba(59,110,190,0.08)", "rgba(146,112,12,0.08)", "rgba(123,97,160,0.08)",
];

function ConfidenceBadge({ confidence }: { confidence?: string }) {
    if (!confidence || confidence === "high") return null;
    const isLow = confidence === "low";
    return (
        <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 10,
            background: isLow ? COLORS.redLight : "rgba(251,191,36,0.12)",
            color: isLow ? COLORS.red : "#92700C",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: 0.5,
        }}>{isLow ? "LOW" : "MED"}</span>
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
        <div ref={containerRef} style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                data-testid="date-picker-trigger"
                style={{
                    width: "100%",
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: selectedDate ? COLORS.text : COLORS.textMuted,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span>{displayText}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        style={{ position: "fixed", inset: 0, zIndex: 99 }}
                        data-testid="date-picker-overlay"
                    />
                    <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                        borderRadius: 12, boxShadow: "0 8px 24px rgba(26,23,20,0.12)",
                        padding: 12,
                    }}>
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
                                    fontSize: 15, fontWeight: 600, color: COLORS.text,
                                },
                                weekday: {
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 11, color: COLORS.textMuted,
                                },
                                day_button: {
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13, borderRadius: 8,
                                    width: 36, height: 36, border: "none",
                                    cursor: "pointer",
                                },
                                today: {
                                    fontWeight: 700, color: COLORS.accent,
                                },
                                selected: {
                                    background: COLORS.accent,
                                    color: "#fff",
                                    borderRadius: 8,
                                },
                                chevron: {
                                    fill: COLORS.textMuted,
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

    const labelStyle: React.CSSProperties = {
        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textMuted,
        display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8,
    };

    const inputStyle: React.CSSProperties = {
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
        padding: "11px 14px", fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 15, color: COLORS.text, outline: "none", width: "100%",
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 40px" }}>
            {/* ── Header ── */}
            <div style={{
                padding: "20px 24px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div>
                    <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textMuted,
                        letterSpacing: 1, textTransform: "uppercase",
                    }}>{mode === "edit" ? "Edit" : "Create"}</div>
                    <h1 style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 26, color: COLORS.text, margin: "4px 0 0", fontWeight: 700,
                    }}>{mode === "edit" ? "Edit Bill" : "New Bill"}</h1>
                </div>
                <button
                    onClick={handleClose}
                    aria-label="Close"
                    data-testid="close-button"
                    style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        fontSize: 18, color: COLORS.textMuted,
                    }}
                >×</button>
            </div>

            {/* ── Title + Date ── */}
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                    <label style={labelStyle}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })}
                        placeholder="e.g. Costco Run March 1"
                        style={inputStyle}
                        data-testid="title-input"
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Date</label>
                    <DatePickerField
                        value={date}
                        onChange={(d) => dispatch({ type: "SET_FIELD", field: "date", value: d })}
                    />
                </div>
            </div>

            {/* ── Accordion ── */}
            <div style={{
                margin: "0 24px", border: `1px solid ${COLORS.border}`,
                borderRadius: 16, overflow: "hidden", background: COLORS.surface,
            }}>
                {sections.map((sec) => (
                    <div key={sec.key}>
                        {/* Section Header */}
                        <button
                            onClick={() => dispatch({ type: "SET_STEP", step: sec.key })}
                            data-testid={`section-header-${sec.key}`}
                            style={{
                                width: "100%", display: "flex", alignItems: "center",
                                justifyContent: "space-between",
                                padding: "16px 20px",
                                background: step === sec.key ? COLORS.surface : "transparent",
                                border: "none", borderBottom: `1px solid ${COLORS.border}`,
                                cursor: "pointer",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{
                                    width: 28, height: 28, borderRadius: "50%",
                                    display: "inline-flex", alignItems: "center",
                                    justifyContent: "center",
                                    background: sec.done || step === sec.key
                                        ? COLORS.accent : COLORS.surfaceAlt,
                                    color: sec.done || step === sec.key
                                        ? "#fff" : COLORS.textMuted,
                                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                                }}>{sec.done ? "✓" : sec.key + 1}</span>
                                <span style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontSize: 15,
                                    color: step === sec.key ? COLORS.text : COLORS.textMuted,
                                    fontWeight: step === sec.key ? 600 : 400,
                                }}>{sec.title}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {sec.count != null && (
                                    <span style={{
                                        fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                        color: COLORS.textMuted,
                                        background: COLORS.surfaceAlt,
                                        padding: "2px 10px", borderRadius: 10,
                                    }}>{sec.count}</span>
                                )}
                                <span style={{
                                    color: COLORS.textMuted, fontSize: 14,
                                    transform: step === sec.key
                                        ? "rotate(180deg)" : "rotate(0)",
                                    transition: "transform .2s", display: "inline-block",
                                }}>▾</span>
                            </div>
                        </button>

                        {/* Section Body */}
                        {step === sec.key && (
                            <div style={{
                                padding: "16px 20px", background: COLORS.bg,
                                borderBottom: `1px solid ${COLORS.border}`,
                            }}>
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
                <div role="alert" style={{
                    margin: "12px 24px 0", padding: "10px 14px", borderRadius: 10,
                    background: COLORS.redLight, color: COLORS.red,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                }}>{error}</div>
            )}

            {/* ── Bottom CTA ── */}
            <div style={{ padding: "24px 24px 0" }}>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    data-testid="submit-button"
                    style={{
                        width: "100%", padding: "16px", borderRadius: 14, border: "none",
                        background: submitting ? COLORS.textMuted : COLORS.green,
                        color: "#fff",
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 16, fontWeight: 600,
                        cursor: submitting ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 12px rgba(45,122,79,0.25)",
                        transition: "all 0.15s",
                    }}
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
        <div style={{ display: "flex", gap: 10 }}>
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
                    style={{
                        flex: 1, padding: "14px", borderRadius: 10, textAlign: "center",
                        background: state.inputMethod === opt.value
                            ? COLORS.accentLight : COLORS.surface,
                        border: `1px solid ${state.inputMethod === opt.value ? COLORS.accent : COLORS.border
                            }`,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: state.inputMethod === opt.value
                            ? COLORS.accent : COLORS.textMuted,
                        fontWeight: state.inputMethod === opt.value ? 600 : 400,
                        cursor: "pointer",
                    }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, i) => (
                <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: COLORS.surface, borderRadius: 10,
                    border: `1px solid ${item.confidence === "low" ? "rgba(190,59,59,0.3)"
                            : item.confidence === "medium" ? "rgba(251,191,36,0.4)"
                                : COLORS.border
                        }`,
                }}>
                    <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => dispatch({
                                type: "UPDATE_ITEM", index: i,
                                field: "name", value: e.target.value,
                            })}
                            placeholder="Item name"
                            data-testid={`item-name-${i}`}
                            style={{
                                border: "none", background: "transparent", outline: "none",
                                fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14,
                                color: COLORS.text, width: "100%",
                            }}
                        />
                        <ConfidenceBadge confidence={item.confidence} />
                    </div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    }}>
                        <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                            color: COLORS.textMuted,
                        }}>$</span>
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
                            style={{
                                border: "none", background: "transparent", outline: "none",
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                fontWeight: 600, color: COLORS.text,
                                width: 60, textAlign: "right",
                            }}
                        />
                        <button
                            onClick={() => dispatch({ type: "REMOVE_ITEM", index: i })}
                            aria-label={`Remove ${item.name || "item"}`}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: COLORS.textMuted, fontSize: 14, padding: "0 2px",
                            }}
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
                style={{
                    padding: "10px", borderRadius: 10,
                    border: `1.5px dashed ${COLORS.border}`,
                    background: "transparent",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: COLORS.accent, cursor: "pointer",
                }}
            >+ Add Item</button>

            {/* Tax / Tip / Subtotal row */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        background: COLORS.surface, borderRadius: 10,
                        border: `1px solid ${COLORS.border}`, padding: "10px 12px",
                    }}>
                        <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                            color: COLORS.textMuted,
                        }}>Tax</span>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 2, marginTop: 2,
                        }}>
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                color: COLORS.textMuted,
                            }}>$</span>
                            <input
                                type="number"
                                value={tax || ""}
                                onChange={(e) => dispatch({
                                    type: "SET_FIELD", field: "tax",
                                    value: parseFloat(e.target.value) || 0,
                                })}
                                min="0" step="0.01"
                                data-testid="tax-input"
                                style={{
                                    border: "none", background: "transparent",
                                    outline: "none",
                                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                    color: COLORS.text, width: "100%",
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        background: COLORS.surface, borderRadius: 10,
                        border: `1px solid ${COLORS.border}`, padding: "10px 12px",
                    }}>
                        <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                            color: COLORS.textMuted,
                        }}>Tip</span>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 2, marginTop: 2,
                        }}>
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                color: COLORS.textMuted,
                            }}>$</span>
                            <input
                                type="number"
                                value={tip || ""}
                                onChange={(e) => dispatch({
                                    type: "SET_FIELD", field: "tip",
                                    value: parseFloat(e.target.value) || 0,
                                })}
                                min="0" step="0.01"
                                data-testid="tip-input"
                                style={{
                                    border: "none", background: "transparent",
                                    outline: "none",
                                    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                    color: COLORS.text, width: "100%",
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        background: COLORS.accentLight, borderRadius: 10,
                        padding: "10px 12px",
                    }}>
                        <span style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                            color: COLORS.textMuted,
                        }}>Subtotal</span>
                        <div style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: 15, fontWeight: 700, color: COLORS.accent,
                            marginTop: 2,
                        }} data-testid="subtotal">{formatCurrency(subtotal)}</div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {participants.length < 2 && (
                <div style={{
                    padding: "8px 12px", borderRadius: 8,
                    background: "rgba(251,191,36,0.12)", color: "#92700C",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                }} data-testid="min-participants-warning">
                    At least 2 participants are required
                </div>
            )}

            {participants.map((p, i) => (
                <div key={i} style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px", background: COLORS.surface,
                    borderRadius: 10, border: `1px solid ${COLORS.border}`,
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: PARTICIPANT_BG[i % PARTICIPANT_BG.length],
                            display: "flex", alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: 13,
                            color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
                            fontWeight: 600,
                        }}>{p.name[0]?.toUpperCase() ?? "?"}</div>
                        <span style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: 14, color: COLORS.text,
                        }}>{p.name}</span>
                    </div>
                    <button
                        onClick={() => dispatch({
                            type: "REMOVE_PARTICIPANT", index: i,
                        })}
                        aria-label={`Remove ${p.name}`}
                        style={{
                            background: "none", border: "none",
                            cursor: "pointer", color: COLORS.textMuted, fontSize: 14,
                        }}
                    >×</button>
                </div>
            ))}

            {/* Add input */}
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    id="new-participant-input"
                    type="text"
                    placeholder="Name"
                    onKeyDown={handleKeyDown}
                    data-testid="participant-name-input"
                    style={{
                        flex: 1, padding: "10px 14px", borderRadius: 10,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.surface,
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 14, color: COLORS.text, outline: "none",
                    }}
                />
                <button
                    onClick={handleAddClick}
                    data-testid="add-participant-button"
                    style={{
                        padding: "10px 16px", borderRadius: 10,
                        border: `1.5px dashed ${COLORS.border}`,
                        background: "transparent",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: COLORS.accent, cursor: "pointer",
                        whiteSpace: "nowrap",
                    }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, ii) => {
                const assigned = assignments[ii] || [];
                const allSelected =
                    assigned.length === participants.length && participants.length > 0;
                return (
                    <div key={ii} style={{
                        background: COLORS.surface, borderRadius: 12,
                        padding: "14px", border: `1px solid ${COLORS.border}`,
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            marginBottom: 8,
                        }}>
                            <span style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: 14, color: COLORS.text,
                            }}>{item.name || "(unnamed)"}</span>
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 13, color: COLORS.textMuted,
                            }}>{formatCurrency(item.price)}</span>
                        </div>
                        <div style={{
                            display: "flex", gap: 6, flexWrap: "wrap",
                        }}>
                            {/* "Everyone" chip */}
                            <button
                                onClick={() => dispatch({
                                    type: "TOGGLE_ALL_ASSIGNMENT", itemIndex: ii,
                                })}
                                data-testid={`everyone-chip-${ii}`}
                                style={{
                                    padding: "5px 14px", borderRadius: 20, fontSize: 13,
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    border: allSelected
                                        ? `1.5px solid ${COLORS.accent}`
                                        : `1.5px solid ${COLORS.border}`,
                                    background: allSelected
                                        ? COLORS.accentLight : "transparent",
                                    color: allSelected
                                        ? COLORS.accent : COLORS.textMuted,
                                    cursor: "pointer", transition: "all .2s",
                                    fontWeight: allSelected ? 600 : 400,
                                }}
                            >Everyone</button>

                            {participants.map((p, pi) => {
                                const active = assigned.includes(pi);
                                const chipColor =
                                    PARTICIPANT_COLORS[pi % PARTICIPANT_COLORS.length];
                                return (
                                    <button
                                        key={pi}
                                        onClick={() => dispatch({
                                            type: "TOGGLE_ASSIGNMENT",
                                            itemIndex: ii, participantIndex: pi,
                                        })}
                                        data-testid={`assignment-chip-${ii}-${pi}`}
                                        style={{
                                            padding: "5px 14px", borderRadius: 20,
                                            fontSize: 13,
                                            fontFamily:
                                                "'Source Serif 4', Georgia, serif",
                                            border: active
                                                ? `1.5px solid ${chipColor}`
                                                : `1.5px solid ${COLORS.border}`,
                                            background: active
                                                ? PARTICIPANT_BG[
                                                pi % PARTICIPANT_BG.length
                                                ]
                                                : "transparent",
                                            color: active
                                                ? chipColor : COLORS.textMuted,
                                            cursor: "pointer",
                                            transition: "all .2s",
                                            fontWeight: active ? 600 : 400,
                                        }}
                                    >{p.name}</button>
                                );
                            })}
                        </div>
                        {assigned.length > 0 && (
                            <div style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                color: COLORS.textMuted, marginTop: 8,
                            }} data-testid={`per-person-cost-${ii}`}>
                                {formatCurrency(item.price / assigned.length)} / person
                            </div>
                        )}
                    </div>
                );
            })}
            {items.length === 0 && (
                <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: COLORS.textMuted, textAlign: "center", padding: 20,
                }}>Add items first to assign participants.</div>
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
            <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: COLORS.textMuted, textAlign: "center", padding: 20,
            }}>Complete the previous steps to see the split preview.</div>
        );
    }

    const editLinkStyle: React.CSSProperties = {
        fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
        color: COLORS.accent, background: "none", border: "none",
        cursor: "pointer", textDecoration: "underline", padding: 0,
    };

    return (
        <div>
            {/* Edit links */}
            <div style={{
                display: "flex", gap: 12, marginBottom: 12,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                color: COLORS.textMuted,
            }}>
                <span>Quick edit:</span>
                <button onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
                    style={editLinkStyle} data-testid="review-edit-items">
                    Items
                </button>
                <button onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
                    style={editLinkStyle} data-testid="review-edit-participants">
                    Participants
                </button>
                <button onClick={() => dispatch({ type: "SET_STEP", step: 3 })}
                    style={editLinkStyle} data-testid="review-edit-assignments">
                    Assignments
                </button>
            </div>

            {/* Per-person cards */}
            {split.per_person.map((p, i) => (
                <div key={i} style={{
                    background: COLORS.surface, borderRadius: 12,
                    padding: "14px 16px",
                    border: `1px solid ${COLORS.border}`, marginBottom: 8,
                }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <span style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: 15, color: COLORS.text,
                        }}>{p.participant_name}</span>
                        <span style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: 17, fontWeight: 700, color: COLORS.accent,
                        }}>{formatCurrency(p.total)}</span>
                    </div>
                    <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                        color: COLORS.textMuted, marginTop: 6,
                    }}>
                        Items {formatCurrency(p.items_subtotal)} ·
                        Tax {formatCurrency(p.tax_share)} ·
                        Tip {formatCurrency(p.tip_share)}
                    </div>
                </div>
            ))}

            {/* Grand total */}
            <div style={{
                marginTop: 12, padding: "14px 16px",
                background: COLORS.accentLight,
                borderRadius: 12, display: "flex",
                justifyContent: "space-between",
            }}>
                <span style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: 15, color: COLORS.text,
                }}>Grand Total</span>
                <span style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: 18, fontWeight: 700, color: COLORS.accent,
                }} data-testid="grand-total">
                    {formatCurrency(split.total)}
                </span>
            </div>

            {/* Rounding disclaimer */}
            <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                color: COLORS.textMuted,
                marginTop: 8, textAlign: "center", fontStyle: "italic",
            }}>
                Final amounts are calculated on save and may differ by a few
                cents due to rounding.
            </div>
        </div>
    );
}

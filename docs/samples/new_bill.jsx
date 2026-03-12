import { useState } from "react";

/*
 * ═══════════════════════════════════════════════════════
 *  SplitWiser — New Bill Page · Prototype B (Accordion)
 *  Color: Warm Light Editorial (bright-color.md)
 *  Data: Aligned to PRD v2 BillFormState + SplitResult
 * ═══════════════════════════════════════════════════════
 */

// ── Design Tokens (bright-color.md) ──
const C = {
    bg: "#F6F3EE",
    surface: "#FFFFFF",
    surfaceAlt: "#EDE9E2",
    border: "#DDD7CC",
    text: "#1A1714",
    muted: "#8C8477",
    accent: "#C05621",
    accentLight: "rgba(192,86,33,0.08)",
    green: "#2D7A4F",
    greenLight: "rgba(45,122,79,0.08)",
    red: "#BE3B3B",
    redLight: "rgba(190,59,59,0.08)",
    blue: "#3B6EBE",
};

// ── Mock Data (mirrors PRD types: BillFormState) ──
const MOCK_ITEMS = [
    { name: "Whole Milk 1gal", price: 4.99, is_ai_parsed: true, confidence: "high" },
    { name: "Org Granola", price: 8.49, is_ai_parsed: true, confidence: "medium" },
    { name: "PROT BAR 12PK", price: 12.99, is_ai_parsed: true, confidence: "high" },
    { name: "Avocado 4ct", price: 5.99, is_ai_parsed: true, confidence: "low" },
    { name: "Sourdough Bread", price: 3.49, is_ai_parsed: false },
];

const MOCK_PARTICIPANTS = [
    { name: "Alice" },
    { name: "Bob" },
    { name: "Charlie" },
];

// assignments: item_index → participant_indices[]
const MOCK_ASSIGNMENTS = {
    0: [0, 1, 2],
    1: [0],
    2: [0, 1],
    3: [1, 2],
    4: [0, 1, 2],
};

// ── Split Engine (PRD Section 4 simplified) ──
function calcSplit(items, participants, assignments, tax, tip) {
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

// ── Micro Components ──
const Chip = ({ children, active, onClick, color = C.accent }) => (
    <button onClick={onClick} style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 13,
        fontFamily: "'Source Serif 4', Georgia, serif",
        border: active ? `1.5px solid ${color}` : `1.5px solid ${C.border}`,
        background: active
            ? color === C.green ? C.greenLight
                : color === C.red ? C.redLight
                    : C.accentLight
            : "transparent",
        color: active ? color : C.muted,
        cursor: "pointer", transition: "all .2s",
        fontWeight: active ? 600 : 400,
    }}>{children}</button>
);

const Badge = ({ confidence }) => {
    if (!confidence || confidence === "high") return null;
    const isLow = confidence === "low";
    return (
        <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 10,
            background: isLow ? C.redLight : "rgba(251,191,36,0.12)",
            color: isLow ? C.red : "#92700C",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: 0.5,
        }}>{isLow ? "LOW" : "MED"}</span>
    );
};

// ── Section Header ──
const SectionHead = ({ sec, expanded, onToggle }) => (
    <button onClick={() => onToggle(sec.key)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", background: expanded === sec.key ? C.surface : "transparent",
        border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: sec.done || expanded === sec.key ? C.accent : C.surfaceAlt,
                color: sec.done || expanded === sec.key ? "#fff" : C.muted,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>{sec.done ? "✓" : sec.key + 1}</span>
            <span style={{
                fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15,
                color: expanded === sec.key ? C.text : C.muted,
                fontWeight: expanded === sec.key ? 600 : 400,
            }}>{sec.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sec.count != null && (
                <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted,
                    background: C.surfaceAlt, padding: "2px 10px", borderRadius: 10,
                }}>{sec.count}</span>
            )}
            <span style={{
                color: C.muted, fontSize: 14,
                transform: expanded === sec.key ? "rotate(180deg)" : "rotate(0)",
                transition: "transform .2s", display: "inline-block",
            }}>▾</span>
        </div>
    </button>
);

// ════════════════════════════════════════════════
//  Main Component
// ════════════════════════════════════════════════
export default function NewBillAccordion() {
    const [expanded, setExpanded] = useState(1);
    const tax = 2.87;
    const tip = 5.00;
    const split = calcSplit(MOCK_ITEMS, MOCK_PARTICIPANTS, MOCK_ASSIGNMENTS, tax, tip);

    const sections = [
        { key: 0, title: "Input Method", icon: "◎", done: true },
        { key: 1, title: "Items", icon: "☰", count: MOCK_ITEMS.length },
        { key: 2, title: "Participants", icon: "◉", count: MOCK_PARTICIPANTS.length },
        { key: 3, title: "Assignment", icon: "⊞" },
        { key: 4, title: "Review", icon: "✓" },
    ];

    const handleToggle = (key) => setExpanded(expanded === key ? -1 : key);

    return (
        <div style={{ background: C.bg, minHeight: "100vh", padding: "0 0 40px" }}>
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
                href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />

            {/* ── Header ── */}
            <div style={{
                padding: "20px 24px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div>
                    <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted,
                        letterSpacing: 1, textTransform: "uppercase",
                    }}>Create</div>
                    <h1 style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 26, color: C.text, margin: "4px 0 0", fontWeight: 700,
                    }}>New Bill</h1>
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: C.surface, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: C.muted,
                }}>×</div>
            </div>

            {/* ── Title + Date ── */}
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                    <label style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted,
                        display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8,
                    }}>Title</label>
                    <div style={{
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                        padding: "11px 14px", fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 15, color: C.text,
                    }}>Costco Run March 1</div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted,
                        display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8,
                    }}>Date</label>
                    <div style={{
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                        padding: "11px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text,
                    }}>Mar 1</div>
                </div>
            </div>

            {/* ── Accordion ── */}
            <div style={{
                margin: "0 24px", border: `1px solid ${C.border}`,
                borderRadius: 16, overflow: "hidden", background: C.surface,
            }}>
                {sections.map((sec) => (
                    <div key={sec.key}>
                        <SectionHead sec={sec} expanded={expanded} onToggle={handleToggle} />

                        {expanded === sec.key && (
                            <div style={{
                                padding: "16px 20px", background: C.bg,
                                borderBottom: `1px solid ${C.border}`,
                            }}>

                                {/* ─── Section 0: Input Method ─── */}
                                {sec.key === 0 && (
                                    <div style={{ display: "flex", gap: 10 }}>
                                        {["📷 Receipt Uploaded", "✏️ Manual Entry"].map((t, i) => (
                                            <div key={i} style={{
                                                flex: 1, padding: "14px", borderRadius: 10, textAlign: "center",
                                                background: i === 0 ? C.accentLight : C.surface,
                                                border: `1px solid ${i === 0 ? C.accent : C.border}`,
                                                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                                color: i === 0 ? C.accent : C.muted,
                                                fontWeight: i === 0 ? 600 : 400,
                                            }}>{t}</div>
                                        ))}
                                    </div>
                                )}

                                {/* ─── Section 1: Items ─── */}
                                {sec.key === 1 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {MOCK_ITEMS.map((item, i) => (
                                            <div key={i} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "10px 14px", background: C.surface, borderRadius: 10,
                                                border: `1px solid ${item.confidence === "low"
                                                        ? "rgba(190,59,59,0.3)"
                                                        : item.confidence === "medium"
                                                            ? "rgba(251,191,36,0.4)"
                                                            : C.border
                                                    }`,
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{
                                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                                        fontSize: 14, color: C.text,
                                                    }}>{item.name}</span>
                                                    <Badge confidence={item.confidence} />
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontSize: 14, fontWeight: 600, color: C.text,
                                                    }}>${item.price.toFixed(2)}</span>
                                                    <span style={{ color: C.muted, cursor: "pointer", fontSize: 14 }}>×</span>
                                                </div>
                                            </div>
                                        ))}

                                        <button style={{
                                            padding: "10px", borderRadius: 10,
                                            border: `1.5px dashed ${C.border}`, background: "transparent",
                                            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                            color: C.accent, cursor: "pointer",
                                        }}>+ Add Item</button>

                                        {/* Tax / Tip / Subtotal row */}
                                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                            {[
                                                { label: "Tax", val: tax },
                                                { label: "Tip", val: tip },
                                            ].map((f, i) => (
                                                <div key={i} style={{
                                                    flex: 1, background: C.surface, borderRadius: 10,
                                                    border: `1px solid ${C.border}`, padding: "10px 12px",
                                                }}>
                                                    <span style={{
                                                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted,
                                                    }}>{f.label}</span>
                                                    <div style={{
                                                        fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                                        color: C.text, marginTop: 2,
                                                    }}>${f.val.toFixed(2)}</div>
                                                </div>
                                            ))}
                                            <div style={{
                                                flex: 1, background: C.accentLight, borderRadius: 10, padding: "10px 12px",
                                            }}>
                                                <span style={{
                                                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted,
                                                }}>Subtotal</span>
                                                <div style={{
                                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                                    fontSize: 15, fontWeight: 700, color: C.accent, marginTop: 2,
                                                }}>${MOCK_ITEMS.reduce((s, i) => s + i.price, 0).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ─── Section 2: Participants ─── */}
                                {sec.key === 2 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {MOCK_PARTICIPANTS.map((p, i) => (
                                            <div key={i} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "10px 14px", background: C.surface, borderRadius: 10,
                                                border: `1px solid ${C.border}`,
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 30, height: 30, borderRadius: "50%",
                                                        background: [C.accentLight, C.greenLight, C.redLight][i],
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                                        fontSize: 13, color: [C.accent, C.green, C.red][i], fontWeight: 600,
                                                    }}>{p.name[0]}</div>
                                                    <span style={{
                                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                                        fontSize: 14, color: C.text,
                                                    }}>{p.name}</span>
                                                </div>
                                                <span style={{ color: C.muted, cursor: "pointer", fontSize: 14 }}>×</span>
                                            </div>
                                        ))}
                                        <button style={{
                                            padding: "10px", borderRadius: 10,
                                            border: `1.5px dashed ${C.border}`, background: "transparent",
                                            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                            color: C.accent, cursor: "pointer",
                                        }}>+ Add Person</button>
                                    </div>
                                )}

                                {/* ─── Section 3: Assignment ─── */}
                                {sec.key === 3 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {MOCK_ITEMS.map((item, ii) => {
                                            const assigned = MOCK_ASSIGNMENTS[ii] || [];
                                            return (
                                                <div key={ii} style={{
                                                    background: C.surface, borderRadius: 12, padding: "14px",
                                                    border: `1px solid ${C.border}`,
                                                }}>
                                                    <div style={{
                                                        display: "flex", justifyContent: "space-between", marginBottom: 8,
                                                    }}>
                                                        <span style={{
                                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                                            fontSize: 14, color: C.text,
                                                        }}>{item.name}</span>
                                                        <span style={{
                                                            fontFamily: "'DM Sans', sans-serif",
                                                            fontSize: 13, color: C.muted,
                                                        }}>${item.price.toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                        {MOCK_PARTICIPANTS.map((p, pi) => (
                                                            <Chip
                                                                key={pi}
                                                                active={assigned.includes(pi)}
                                                                color={[C.accent, C.green, C.red][pi]}
                                                            >{p.name}</Chip>
                                                        ))}
                                                    </div>
                                                    {assigned.length > 0 && (
                                                        <div style={{
                                                            fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                                            color: C.muted, marginTop: 8,
                                                        }}>
                                                            ${(item.price / assigned.length).toFixed(2)} / person
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ─── Section 4: Review ─── */}
                                {sec.key === 4 && split && (
                                    <div>
                                        {split.per_person.map((p, i) => (
                                            <div key={i} style={{
                                                background: C.surface, borderRadius: 12, padding: "14px 16px",
                                                border: `1px solid ${C.border}`, marginBottom: 8,
                                            }}>
                                                <div style={{
                                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                                }}>
                                                    <span style={{
                                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                                        fontSize: 15, color: C.text,
                                                    }}>{p.participant_name}</span>
                                                    <span style={{
                                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                                        fontSize: 17, fontWeight: 700, color: C.accent,
                                                    }}>${p.total.toFixed(2)}</span>
                                                </div>
                                                <div style={{
                                                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                                    color: C.muted, marginTop: 6,
                                                }}>
                                                    Items ${p.items_subtotal.toFixed(2)} · Tax ${p.tax_share.toFixed(2)} · Tip ${p.tip_share.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{
                                            marginTop: 12, padding: "14px 16px", background: C.accentLight,
                                            borderRadius: 12, display: "flex", justifyContent: "space-between",
                                        }}>
                                            <span style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontSize: 15, color: C.text,
                                            }}>Grand Total</span>
                                            <span style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontSize: 18, fontWeight: 700, color: C.accent,
                                            }}>${split.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Bottom CTA ── */}
            <div style={{ padding: "24px 24px 0" }}>
                <button style={{
                    width: "100%", padding: "16px", borderRadius: 14, border: "none",
                    background: C.green, color: "#fff",
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: 16, fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(45,122,79,0.25)",
                }}>Save & Share Bill</button>
            </div>
        </div>
    );
}
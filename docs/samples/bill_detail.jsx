import { useState } from "react";

// Mock data based on PRD BillDetail type
const mockBillDetail = {
  bill: {
    id: "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: "u1234",
    title: "Costco Run March 1",
    date: "2026-03-01",
    tax: 8.5,
    tip: 5.0,
    receipt_image_url: null,
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:30:00Z",
  },
  items: [
    { id: "i1", bill_id: "b1", name: "Whole Milk 1gal", price: 4.99, is_ai_parsed: true, created_at: "2026-03-01T10:00:00Z" },
    { id: "i2", bill_id: "b1", name: "Protein Bars 12pk", price: 12.99, is_ai_parsed: true, created_at: "2026-03-01T10:00:00Z" },
    { id: "i3", bill_id: "b1", name: "Organic Granola", price: 8.49, is_ai_parsed: false, created_at: "2026-03-01T10:00:00Z" },
    { id: "i4", bill_id: "b1", name: "Rotisserie Chicken", price: 4.99, is_ai_parsed: true, created_at: "2026-03-01T10:00:00Z" },
    { id: "i5", bill_id: "b1", name: "Sparkling Water 24pk", price: 5.99, is_ai_parsed: false, created_at: "2026-03-01T10:00:00Z" },
  ],
  participants: [
    { id: "p1", bill_id: "b1", name: "Alice", created_at: "2026-03-01T10:00:00Z" },
    { id: "p2", bill_id: "b1", name: "Bob", created_at: "2026-03-01T10:00:00Z" },
    { id: "p3", bill_id: "b1", name: "Charlie", created_at: "2026-03-01T10:00:00Z" },
  ],
  assignments: [
    { id: "a1", bill_item_id: "i1", participant_id: "p1" },
    { id: "a2", bill_item_id: "i1", participant_id: "p2" },
    { id: "a3", bill_item_id: "i1", participant_id: "p3" },
    { id: "a4", bill_item_id: "i2", participant_id: "p1" },
    { id: "a5", bill_item_id: "i3", participant_id: "p2" },
    { id: "a6", bill_item_id: "i4", participant_id: "p2" },
    { id: "a7", bill_item_id: "i4", participant_id: "p3" },
    { id: "a8", bill_item_id: "i5", participant_id: "p1" },
    { id: "a9", bill_item_id: "i5", participant_id: "p2" },
    { id: "a10", bill_item_id: "i5", participant_id: "p3" },
  ],
  split: {
    per_person: [
      {
        participant_id: "p1",
        participant_name: "Alice",
        items_subtotal: 20.64,
        tax_share: 4.69,
        tip_share: 2.76,
        total: 28.09,
      },
      {
        participant_id: "p2",
        participant_name: "Bob",
        items_subtotal: 17.13,
        tax_share: 3.89,
        tip_share: 2.29,
        total: 23.31,
      },
      {
        participant_id: "p3",
        participant_name: "Charlie",
        items_subtotal: 6.15,
        tax_share: 1.40,
        tip_share: 0.82,
        total: 8.37,
      },
    ],
    subtotal: 37.45,
    tax: 8.5,
    tip: 5.0,
    total: 50.95,
  },
};

// Map items to participants for display
function getItemAssignees(itemId, assignments, participants) {
  const assignedIds = assignments.filter((a) => a.bill_item_id === itemId).map((a) => a.participant_id);
  return participants.filter((p) => assignedIds.includes(p.id));
}

function getPersonItems(participantId, items, assignments) {
  const assignedItemIds = assignments.filter((a) => a.participant_id === participantId).map((a) => a.bill_item_id);
  return items.filter((item) => assignedItemIds.includes(item.id)).map((item) => {
    const sharedWith = assignments.filter((a) => a.bill_item_id === item.id).length;
    return { ...item, sharedWith, sharePrice: +(item.price / sharedWith).toFixed(2) };
  });
}

const colors = {
  bg: "#F6F3EE",
  surface: "#FFFFFF",
  surfaceAlt: "#EDE9E2",
  border: "#DDD7CC",
  text: "#1A1714",
  textMuted: "#8C8477",
  accent: "#C05621",
  accentLight: "rgba(192,86,33,0.08)",
  green: "#2D7A4F",
  greenLight: "rgba(45,122,79,0.08)",
  red: "#BE3B3B",
  redLight: "rgba(190,59,59,0.08)",
  blue: "#3B6EBE",
};

const avatarColors = ["#C05621", "#3B6EBE", "#2D7A4F", "#BE3B3B", "#8C8477"];

function Avatar({ name, index, size = 32 }) {
  const color = avatarColors[index % avatarColors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function AvatarStack({ participants, participantMap, size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {participants.map((p, i) => (
        <div
          key={p.id}
          style={{ marginLeft: i > 0 ? -6 : 0, zIndex: participants.length - i }}
          title={p.name}
        >
          <Avatar name={p.name} index={participantMap[p.id]} size={size} />
        </div>
      ))}
    </div>
  );
}

export default function BillDetailPage() {
  const data = mockBillDetail;
  const { bill, items, participants, assignments, split } = data;
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState("split"); // "split" | "items" | "assignments"

  const participantMap = {};
  participants.forEach((p, i) => (participantMap[p.id] = i));

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formattedDate = new Date(bill.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: ${colors.bg};
          font-family: 'DM Sans', sans-serif;
          color: ${colors.text};
          -webkit-font-smoothing: antialiased;
        }

        .page-shell {
          min-height: 100vh;
          background: ${colors.bg};
        }

        /* Navbar */
        .navbar {
          background: ${colors.surface};
          border-bottom: 1px solid ${colors.border};
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .navbar-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: ${colors.accent};
          letter-spacing: -0.02em;
        }
        .navbar-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .navbar-link {
          font-size: 13px;
          color: ${colors.textMuted};
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.15s;
          cursor: pointer;
        }
        .navbar-link:hover { background: ${colors.surfaceAlt}; color: ${colors.text}; }
        .navbar-link.active { background: ${colors.accentLight}; color: ${colors.accent}; font-weight: 500; }

        /* Content */
        .content { max-width: 720px; margin: 0 auto; padding: 24px 16px 100px; }

        /* Back link */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: ${colors.textMuted};
          text-decoration: none;
          cursor: pointer;
          margin-bottom: 20px;
          transition: color 0.15s;
        }
        .back-link:hover { color: ${colors.accent}; }

        /* Header card */
        .header-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 16px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }
        .bill-title {
          font-family: 'DM Serif Display', serif;
          font-size: 26px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: ${colors.text};
        }
        .bill-date {
          font-size: 13px;
          color: ${colors.textMuted};
          margin-top: 4px;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .btn-primary {
          background: ${colors.accent};
          color: #fff;
          border-color: ${colors.accent};
        }
        .btn-primary:hover { filter: brightness(1.1); }
        .btn-outline {
          background: transparent;
          color: ${colors.text};
          border-color: ${colors.border};
        }
        .btn-outline:hover { background: ${colors.surfaceAlt}; }
        .btn-danger {
          background: transparent;
          color: ${colors.red};
          border-color: ${colors.border};
        }
        .btn-danger:hover { background: ${colors.redLight}; border-color: ${colors.red}; }
        .btn-ghost {
          background: transparent;
          color: ${colors.textMuted};
          padding: 6px 10px;
        }
        .btn-ghost:hover { background: ${colors.surfaceAlt}; color: ${colors.text}; }
        .btn-share-success {
          background: ${colors.greenLight};
          color: ${colors.green};
          border-color: ${colors.green};
        }

        /* Summary strip */
        .summary-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: ${colors.border};
          border-radius: 8px;
          overflow: hidden;
        }
        .summary-cell {
          background: ${colors.surface};
          padding: 14px 16px;
          text-align: center;
        }
        .summary-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: ${colors.textMuted};
          margin-bottom: 4px;
        }
        .summary-value {
          font-size: 18px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid ${colors.border};
          margin-bottom: 16px;
        }
        .tab {
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 500;
          color: ${colors.textMuted};
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.15s;
          font-family: inherit;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
        }
        .tab:hover { color: ${colors.text}; }
        .tab.active {
          color: ${colors.accent};
          border-bottom-color: ${colors.accent};
        }

        /* Split cards */
        .person-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 10px;
          margin-bottom: 10px;
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .person-card:hover { box-shadow: 0 2px 8px rgba(26,23,20,0.06); }
        .person-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          cursor: pointer;
          user-select: none;
        }
        .person-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .person-name { font-weight: 500; font-size: 15px; }
        .person-total {
          font-size: 17px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .person-expand {
          font-size: 18px;
          color: ${colors.textMuted};
          transition: transform 0.2s;
          margin-left: 8px;
        }
        .person-expand.open { transform: rotate(180deg); }

        .person-detail {
          border-top: 1px solid ${colors.border};
          padding: 14px 18px;
          background: ${colors.bg};
        }
        .detail-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 13px;
        }
        .detail-item-name { color: ${colors.text}; }
        .detail-shared-badge {
          font-size: 11px;
          color: ${colors.textMuted};
          background: ${colors.surfaceAlt};
          padding: 1px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }
        .detail-item-price { font-variant-numeric: tabular-nums; font-weight: 500; }
        .detail-divider {
          border: none;
          border-top: 1px dashed ${colors.border};
          margin: 8px 0;
        }
        .detail-extra-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 12px;
          color: ${colors.textMuted};
        }

        /* Items table */
        .items-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 10px;
          overflow: hidden;
        }
        .item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-bottom: 1px solid ${colors.border};
          gap: 12px;
        }
        .item-row:last-child { border-bottom: none; }
        .item-info { flex: 1; min-width: 0; }
        .item-name {
          font-size: 14px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-meta {
          font-size: 12px;
          color: ${colors.textMuted};
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-badge {
          font-size: 10px;
          font-weight: 600;
          color: ${colors.blue};
          background: rgba(59,110,190,0.08);
          padding: 1px 5px;
          border-radius: 3px;
          letter-spacing: 0.03em;
        }
        .item-price {
          font-size: 14px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }

        /* Assignment matrix */
        .matrix-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 10px;
          padding: 18px;
          overflow-x: auto;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .matrix-table th {
          text-align: center;
          padding: 8px 6px;
          font-weight: 500;
          font-size: 12px;
          color: ${colors.textMuted};
          border-bottom: 1px solid ${colors.border};
        }
        .matrix-table th:first-child { text-align: left; }
        .matrix-table td {
          padding: 10px 6px;
          border-bottom: 1px solid ${colors.border};
          text-align: center;
        }
        .matrix-table td:first-child {
          text-align: left;
          font-weight: 500;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .matrix-table tr:last-child td { border-bottom: none; }
        .check-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .check-dot.assigned {
          background: ${colors.accentLight};
          color: ${colors.accent};
        }
        .check-dot.unassigned {
          background: ${colors.surfaceAlt};
          color: ${colors.border};
        }

        /* Delete dialog */
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,23,20,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.15s;
        }
        .dialog-box {
          background: ${colors.surface};
          border-radius: 12px;
          padding: 28px;
          max-width: 380px;
          width: calc(100% - 32px);
          box-shadow: 0 20px 60px rgba(26,23,20,0.2);
          animation: slideUp 0.2s;
        }
        .dialog-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          margin-bottom: 8px;
        }
        .dialog-body {
          font-size: 14px;
          color: ${colors.textMuted};
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .dialog-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        /* Mobile bottom bar */
        .mobile-bottom-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: ${colors.surface};
          border-top: 1px solid ${colors.border};
          padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
          z-index: 100;
        }
        .mobile-bottom-inner {
          display: flex;
          gap: 8px;
        }
        .mobile-bottom-inner .btn { flex: 1; justify-content: center; }

        @media (max-width: 640px) {
          .content { padding: 16px 12px 120px; }
          .bill-title { font-size: 22px; }
          .header-actions { display: none; }
          .mobile-bottom-bar { display: block; }
          .summary-strip { grid-template-columns: repeat(2, 1fr); }
          .tab { padding: 10px 14px; font-size: 12px; }
          .matrix-card { padding: 10px; }
          .person-header { padding: 12px 14px; }
          .person-detail { padding: 12px 14px; }
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="page-shell">
        {/* Navbar */}
        <nav className="navbar">
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <span className="navbar-logo">SplitWiser</span>
            <div style={{ display: "flex", gap: 4 }}>
              <span className="navbar-link active">Dashboard</span>
              <span className="navbar-link">History</span>
            </div>
          </div>
          <div className="navbar-user">
            <Avatar name="Qingyang" index={0} size={30} />
          </div>
        </nav>

        <div className="content">
          {/* Back */}
          <a className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </a>

          {/* Header */}
          <div className="header-card">
            <div className="header-top">
              <div>
                <h1 className="bill-title">{bill.title}</h1>
                <div className="bill-date">{formattedDate}</div>
              </div>
              <div className="header-actions">
                <button
                  className={copiedLink ? "btn btn-share-success" : "btn btn-primary"}
                  onClick={handleCopyLink}
                >
                  {copiedLink ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share
                    </>
                  )}
                </button>
                <button className="btn btn-outline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => setShowDeleteDialog(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="summary-strip">
              <div className="summary-cell">
                <div className="summary-label">Subtotal</div>
                <div className="summary-value">${split.subtotal.toFixed(2)}</div>
              </div>
              <div className="summary-cell">
                <div className="summary-label">Tax</div>
                <div className="summary-value">${split.tax.toFixed(2)}</div>
              </div>
              <div className="summary-cell">
                <div className="summary-label">Tip</div>
                <div className="summary-value">${split.tip.toFixed(2)}</div>
              </div>
              <div className="summary-cell">
                <div className="summary-label">Total</div>
                <div className="summary-value" style={{ color: colors.accent }}>${split.total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${activeTab === "split" ? "active" : ""}`} onClick={() => setActiveTab("split")}>
              Split Summary
            </button>
            <button className={`tab ${activeTab === "items" ? "active" : ""}`} onClick={() => setActiveTab("items")}>
              Items ({items.length})
            </button>
            <button className={`tab ${activeTab === "assignments" ? "active" : ""}`} onClick={() => setActiveTab("assignments")}>
              Assignments
            </button>
          </div>

          {/* Tab: Split Summary */}
          {activeTab === "split" && (
            <div>
              {split.per_person.map((person) => {
                const isExpanded = expandedPerson === person.participant_id;
                const personItems = getPersonItems(person.participant_id, items, assignments);
                return (
                  <div className="person-card" key={person.participant_id}>
                    <div className="person-header" onClick={() => setExpandedPerson(isExpanded ? null : person.participant_id)}>
                      <div className="person-left">
                        <Avatar name={person.participant_name} index={participantMap[person.participant_id]} />
                        <span className="person-name">{person.participant_name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="person-total">${person.total.toFixed(2)}</span>
                        <span className={`person-expand ${isExpanded ? "open" : ""}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="person-detail">
                        {personItems.map((item) => (
                          <div className="detail-item-row" key={item.id}>
                            <div>
                              <span className="detail-item-name">{item.name}</span>
                              {item.sharedWith > 1 && (
                                <span className="detail-shared-badge">÷{item.sharedWith}</span>
                              )}
                            </div>
                            <span className="detail-item-price">${item.sharePrice.toFixed(2)}</span>
                          </div>
                        ))}
                        <hr className="detail-divider" />
                        <div className="detail-extra-row">
                          <span>Items subtotal</span>
                          <span>${person.items_subtotal.toFixed(2)}</span>
                        </div>
                        <div className="detail-extra-row">
                          <span>Tax share</span>
                          <span>${person.tax_share.toFixed(2)}</span>
                        </div>
                        <div className="detail-extra-row">
                          <span>Tip share</span>
                          <span>${person.tip_share.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Items */}
          {activeTab === "items" && (
            <div className="items-card">
              {items.map((item) => {
                const assignees = getItemAssignees(item.id, assignments, participants);
                return (
                  <div className="item-row" key={item.id}>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">
                        <AvatarStack participants={assignees} participantMap={participantMap} size={18} />
                        <span>{assignees.map((a) => a.name).join(", ")}</span>
                        {item.is_ai_parsed && <span className="ai-badge">AI</span>}
                      </div>
                    </div>
                    <span className="item-price">${item.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Assignments */}
          {activeTab === "assignments" && (
            <div className="matrix-card">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    {participants.map((p) => (
                      <th key={p.id}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <Avatar name={p.name} index={participantMap[p.id]} size={24} />
                          <span>{p.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      {participants.map((p) => {
                        const assigned = assignments.some(
                          (a) => a.bill_item_id === item.id && a.participant_id === p.id
                        );
                        return (
                          <td key={p.id}>
                            <span className={`check-dot ${assigned ? "assigned" : "unassigned"}`}>
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
          )}
        </div>

        {/* Mobile bottom bar */}
        <div className="mobile-bottom-bar">
          <div className="mobile-bottom-inner">
            <button className={copiedLink ? "btn btn-share-success" : "btn btn-primary"} onClick={handleCopyLink}>
              {copiedLink ? "Copied!" : "Share"}
            </button>
            <button className="btn btn-outline">Edit</button>
            <button className="btn btn-danger" onClick={() => setShowDeleteDialog(true)}>Delete</button>
          </div>
        </div>

        {/* Delete dialog */}
        {showDeleteDialog && (
          <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
            <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-title">Delete this bill?</div>
              <div className="dialog-body">
                This will permanently delete "{bill.title}" and all associated items, participants, and assignments. This action cannot be undone.
              </div>
              <div className="dialog-actions">
                <button className="btn btn-outline" onClick={() => setShowDeleteDialog(false)}>Cancel</button>
                <button className="btn btn-danger">Delete Bill</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
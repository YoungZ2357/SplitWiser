import { COLORS } from "@/lib/colors";

interface PaginationBarProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

/**
 * PaginationBar — displays page info and prev/next buttons.
 * Returns null if totalPages <= 1.
 */
export default function PaginationBar({ currentPage, totalPages, onPageChange }: PaginationBarProps) {
    if (totalPages <= 1) return null;

    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 24px",
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.surfaceAlt,
        }}>
      <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12.5,
          color: COLORS.textMuted,
      }}>
        Page {currentPage} of {totalPages}
      </span>
            <div style={{ display: "flex", gap: 6 }}>
                <PageBtn
                    label="Prev"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                />
                <PageBtn
                    label="Next"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                />
            </div>
        </div>
    );
}

interface PageBtnProps {
    label: string;
    disabled: boolean;
    onClick: () => void;
}

function PageBtn({ label, disabled, onClick }: PageBtnProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color: disabled ? COLORS.border : COLORS.accent,
                background: disabled ? "transparent" : COLORS.accentLight,
                border: `1px solid ${disabled ? COLORS.border : "rgba(192,86,33,0.15)"}`,
                borderRadius: 6,
                padding: "5px 14px",
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.15s ease",
                opacity: disabled ? 0.5 : 1,
            }}
        >{label}</button>
    );
}
import { cn } from "@/lib/cn";

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
        <div className="flex justify-between items-center px-6 py-3 border-t border-border bg-surface-alt">
            <span className="font-sans text-[12.5px] text-text-muted">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1.5">
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
            className={cn(
                "font-sans text-[12.5px] font-semibold rounded-md px-3.5 py-1.5 transition-all duration-150",
                disabled
                    ? "text-border bg-transparent border border-border cursor-default opacity-50"
                    : "text-accent bg-accent-light border border-accent/15 cursor-pointer opacity-100"
            )}
        >{label}</button>
    );
}
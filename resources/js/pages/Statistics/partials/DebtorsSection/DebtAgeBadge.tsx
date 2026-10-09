import { DebtAgeTone, formatDaysAgo, getDebtAgeTone } from "@/utils/debtAge";

const TONE_STYLES: Record<DebtAgeTone, string> = {
    attention: "bg-amber-100 text-amber-700",
    stagnant: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-600",
};

interface DebtAgeBadgeProps {
    days: number | null;
}

export const DebtAgeBadge = ({ days }: DebtAgeBadgeProps) => {
    if (days === null) return <span className="text-stone-300">—</span>;

    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums whitespace-nowrap ${TONE_STYLES[getDebtAgeTone(days)]}`}>
            {formatDaysAgo(days)}
        </span>
    );
};

import { daysUntilDate } from "@/utils/dateUtils";
import { LayawayDueTone, getLayawayDueInfo } from "@/utils/layawayCalc";

const TONE_STYLES: Record<LayawayDueTone, string> = {
    ok: "bg-stone-100 text-stone-600",
    soon: "bg-amber-100 text-amber-700 font-semibold",
    overdue: "bg-red-100 text-red-600 font-semibold",
};

interface LayawayDueBadgeProps {
    dueDate: string | null;
}

export const LayawayDueBadge = ({ dueDate }: LayawayDueBadgeProps) => {
    const { label, tone } = getLayawayDueInfo(dueDate ? daysUntilDate(dueDate) : null);

    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${TONE_STYLES[tone]}`}>
            {label}
        </span>
    );
};

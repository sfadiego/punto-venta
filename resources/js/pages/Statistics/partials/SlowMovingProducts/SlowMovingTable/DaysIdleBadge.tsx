import { SlowMovingTone, getSlowMovingTone } from "@/utils/slowMoving";

const TONE_STYLES: Record<SlowMovingTone, string> = {
    attention: "bg-amber-100 text-amber-700",
    stagnant: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-600",
};

interface DaysIdleBadgeProps {
    days: number;
}

export const DaysIdleBadge = ({ days }: DaysIdleBadgeProps) => (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums ${TONE_STYLES[getSlowMovingTone(days)]}`}>
        {days} {days === 1 ? "día" : "días"}
    </span>
);

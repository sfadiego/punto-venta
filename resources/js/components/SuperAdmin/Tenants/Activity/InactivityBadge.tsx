import { daysSince } from "@/utils/dateUtils";

const WARNING_DAYS = 7;
const CRITICAL_DAYS = 14;

interface InactivityBadgeProps {
    lastActivityAt: string | null | undefined;
}

export const InactivityBadge = ({ lastActivityAt }: InactivityBadgeProps) => {
    const days = daysSince(lastActivityAt);

    if (days === null) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                Sin actividad
            </span>
        );
    }

    if (days < WARNING_DAYS) return null;

    const isCritical = days >= CRITICAL_DAYS;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
            }`}
        >
            {days} día{days !== 1 ? "s" : ""} sin actividad
        </span>
    );
};

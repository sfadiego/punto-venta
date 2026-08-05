import { WorkDay } from "@/models/IEmployee";
import { formatWorkDays } from "@/utils/workDaysUtils";

interface WorkDaysBadgeProps {
    days: WorkDay[];
}

export const WorkDaysBadge = ({ days }: WorkDaysBadgeProps) => (
    <span className="text-sm text-stone-600">{formatWorkDays(days)}</span>
);

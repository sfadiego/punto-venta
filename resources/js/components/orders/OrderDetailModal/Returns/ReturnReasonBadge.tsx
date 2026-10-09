import { RETURN_REASON_LABELS, ReturnReasonEnum } from "@/enums/ReturnReasonEnum";

const REASON_STYLES: Record<ReturnReasonEnum, string> = {
    [ReturnReasonEnum.Defective]: "bg-red-100 text-red-600",
    [ReturnReasonEnum.NotWanted]: "bg-stone-100 text-stone-600",
    [ReturnReasonEnum.Other]: "bg-stone-100 text-stone-600",
};

interface ReturnReasonBadgeProps {
    reason: ReturnReasonEnum;
}

export const ReturnReasonBadge = ({ reason }: ReturnReasonBadgeProps) => (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${REASON_STYLES[reason]}`}>
        {RETURN_REASON_LABELS[reason]}
    </span>
);

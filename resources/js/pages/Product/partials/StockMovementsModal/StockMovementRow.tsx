import { ArrowDownCircle, ArrowUpCircle, RefreshCcw, LucideIcon } from "lucide-react";
import { IStockMovement } from "@/models/IStockMovement";
import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { STOCK_MOVEMENT_REASON_LABELS } from "@/enums/StockMovementReasonEnum";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface StockMovementRowProps {
    movement: IStockMovement;
}

const TYPE_ICON: Record<StockMovementTypeEnum, LucideIcon> = {
    [StockMovementTypeEnum.Entry]: ArrowUpCircle,
    [StockMovementTypeEnum.Exit]: ArrowDownCircle,
    [StockMovementTypeEnum.Adjustment]: RefreshCcw,
};

const TYPE_COLOR: Record<StockMovementTypeEnum, string> = {
    [StockMovementTypeEnum.Entry]: "text-emerald-600",
    [StockMovementTypeEnum.Exit]: "text-red-600",
    [StockMovementTypeEnum.Adjustment]: "text-amber-600",
};

export const StockMovementRow = ({ movement }: StockMovementRowProps) => {
    const Icon = TYPE_ICON[movement.type];
    const isEntry = movement.type !== StockMovementTypeEnum.Exit;

    return (
        <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-b-0">
            <Icon size={18} className={`shrink-0 mt-0.5 ${TYPE_COLOR[movement.type]}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-800">{STOCK_MOVEMENT_REASON_LABELS[movement.reason]}</p>
                    <span className={`text-sm font-bold tabular-nums shrink-0 ${TYPE_COLOR[movement.type]}`}>
                        {isEntry ? "+" : "-"}
                        {trimDecimalZeros(movement.quantity)}
                    </span>
                </div>
                <p className="text-xs text-stone-400 tabular-nums">
                    {trimDecimalZeros(movement.stock_before)} → {trimDecimalZeros(movement.stock_after)}
                </p>
                {movement.note && <p className="text-xs text-stone-500 mt-0.5">{movement.note}</p>}
                <p className="text-[11px] text-stone-400 mt-1">
                    {formatOrderDateTime(movement.created_at)}
                    {movement.created_by && ` · ${movement.created_by.nombre}`}
                </p>
            </div>
        </div>
    );
};

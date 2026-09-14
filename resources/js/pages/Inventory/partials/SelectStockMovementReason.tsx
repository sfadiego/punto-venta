import { Select } from "@/components/ui/form/Select";
import { StockMovementReasonEnum, STOCK_MOVEMENT_REASON_LABELS } from "@/enums/StockMovementReasonEnum";
import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { REASONS_BY_TYPE } from "@/utils/stockMovementFilters";

interface SelectStockMovementReasonProps {
    value: string;
    onChange: (value: string) => void;
    /** Si viene un tipo, las razones se acotan a las que ese tipo realmente puede tener
     * (ver utils/stockMovementFilters.ts) — nunca ofrecer, por ejemplo, "Venta" cuando el
     * tipo elegido es "Entrada". */
    type?: StockMovementTypeEnum | "";
    className?: string;
}

export const SelectStockMovementReason = ({ value, onChange, type, className }: SelectStockMovementReasonProps) => {
    const allowedReasons = type ? REASONS_BY_TYPE[type] : null;
    const options = [
        { value: "", label: "Todas las razones" },
        ...Object.values(StockMovementReasonEnum)
            .filter((reason) => !allowedReasons || allowedReasons.includes(reason))
            .map((reason) => ({ value: reason, label: STOCK_MOVEMENT_REASON_LABELS[reason] })),
    ];

    return (
        <Select<{ reason: string }>
            name="reason"
            options={options}
            value={value}
            onChange={onChange}
            className={className}
        />
    );
};

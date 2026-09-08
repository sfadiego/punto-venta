import { Select } from "@/components/ui/form/Select";
import { StockMovementReasonEnum, STOCK_MOVEMENT_REASON_LABELS } from "@/enums/StockMovementReasonEnum";

const REASON_OPTIONS = [
    { value: "", label: "Todas las razones" },
    ...Object.values(StockMovementReasonEnum).map((value) => ({
        value,
        label: STOCK_MOVEMENT_REASON_LABELS[value],
    })),
];

interface SelectStockMovementReasonProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SelectStockMovementReason = ({ value, onChange, className }: SelectStockMovementReasonProps) => (
    <Select<{ reason: string }>
        name="reason"
        options={REASON_OPTIONS}
        value={value}
        onChange={onChange}
        className={className}
    />
);

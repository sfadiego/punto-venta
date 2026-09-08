import { Select } from "@/components/ui/form/Select";
import { StockMovementTypeEnum, STOCK_MOVEMENT_TYPE_LABELS } from "@/enums/StockMovementTypeEnum";

const TYPE_OPTIONS = [
    { value: "", label: "Todos los tipos" },
    ...Object.values(StockMovementTypeEnum).map((value) => ({
        value,
        label: STOCK_MOVEMENT_TYPE_LABELS[value],
    })),
];

interface SelectStockMovementTypeProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SelectStockMovementType = ({ value, onChange, className }: SelectStockMovementTypeProps) => (
    <Select<{ type: string }>
        name="type"
        options={TYPE_OPTIONS}
        value={value}
        onChange={onChange}
        className={className}
    />
);

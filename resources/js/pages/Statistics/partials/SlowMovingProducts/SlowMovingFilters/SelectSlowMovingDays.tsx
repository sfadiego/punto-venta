import { Select, SelectOption } from "@/components/ui/form/Select";
import { SLOW_MOVING_DAY_OPTIONS } from "@/utils/slowMoving";

const DAY_OPTIONS: SelectOption[] = SLOW_MOVING_DAY_OPTIONS.map((days) => ({
    value: String(days),
    label: `Más de ${days} días sin movimiento`,
}));

interface SelectSlowMovingDaysProps {
    value: number;
    onChange: (days: number) => void;
}

// Selector controlado del umbral — las opciones viven aquí, no en quien lo consume.
export const SelectSlowMovingDays = ({ value, onChange }: SelectSlowMovingDaysProps) => (
    <Select<{ days: string }>
        name="days"
        options={DAY_OPTIONS}
        value={String(value)}
        onChange={(selected) => onChange(Number(selected))}
    />
);

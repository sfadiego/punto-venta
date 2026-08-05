import { Select } from "@/components/ui/form/Select";

const ACTIVE_FILTER_OPTIONS = [
    { value: "", label: "Todos los estados" },
    { value: "true", label: "Activos" },
    { value: "false", label: "Ocultos" },
];

interface SelectEmployeeActiveFilterProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SelectEmployeeActiveFilter = ({ value, onChange, className }: SelectEmployeeActiveFilterProps) => (
    <Select<{ active: string }>
        name="active"
        options={ACTIVE_FILTER_OPTIONS}
        value={value}
        onChange={onChange}
        className={className}
    />
);

import { Select } from "@/components/ui/form/Select";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";

const STATUS_FILTERS: { label: string; value: TenantStatusEnum }[] = [
    { label: "Todos",      value: TenantStatusEnum.All },
    { label: "Activos",    value: TenantStatusEnum.Active },
    { label: "Inactivos",  value: TenantStatusEnum.Inactive },
    { label: "Eliminados", value: TenantStatusEnum.Deleted },
];

const DEMO_FILTERS: { label: string; value: TenantDemoFilterEnum }[] = [
    { label: "Demo", value: TenantDemoFilterEnum.Demo },
];

const STATUS_PREFIX = "status:";
const DEMO_PREFIX = "demo:";

const FILTER_OPTIONS = [
    ...STATUS_FILTERS.map((f) => ({ value: `${STATUS_PREFIX}${f.value}`, label: f.label })),
    ...DEMO_FILTERS.map((f) => ({ value: `${DEMO_PREFIX}${f.value}`, label: f.label })),
];

interface SelectTenantFilterProps {
    status: TenantStatusEnum;
    demoFilter: TenantDemoFilterEnum;
    onStatusChange: (value: TenantStatusEnum) => void;
    onDemoFilterChange: (value: TenantDemoFilterEnum) => void;
    className?: string;
}

export const SelectTenantFilter = ({
    status,
    demoFilter,
    onStatusChange,
    onDemoFilterChange,
    className,
}: SelectTenantFilterProps) => {
    const value =
        demoFilter !== TenantDemoFilterEnum.All
            ? `${DEMO_PREFIX}${demoFilter}`
            : `${STATUS_PREFIX}${status}`;

    const handleChange = (raw: string) => {
        if (raw.startsWith(DEMO_PREFIX)) {
            onDemoFilterChange(raw.slice(DEMO_PREFIX.length) as TenantDemoFilterEnum);
            onStatusChange(TenantStatusEnum.All);
        } else {
            onStatusChange(raw.slice(STATUS_PREFIX.length) as TenantStatusEnum);
            onDemoFilterChange(TenantDemoFilterEnum.All);
        }
    };

    return (
        <Select<{ filter: string }>
            name="filter"
            options={FILTER_OPTIONS}
            value={value}
            onChange={handleChange}
            className={className}
        />
    );
};

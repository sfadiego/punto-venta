import { Select } from "@/components/ui/form/Select";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";

const STATUS_FILTERS = [
    { label: "Todos",             value: "" },
    { label: "Activos",           value: SubscriptionStatusEnum.Active },
    { label: "Vencidos",          value: SubscriptionStatusEnum.Expired },
    { label: "Período de gracia", value: SubscriptionStatusEnum.Grace },
    { label: "Sin suscripción",   value: SubscriptionStatusEnum.Pending },
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

interface SelectSubscriptionFilterProps {
    statusFilter: SubscriptionStatusEnum | "";
    demoFilter: TenantDemoFilterEnum;
    onStatusFilterChange: (value: SubscriptionStatusEnum | "") => void;
    onDemoFilterChange: (value: TenantDemoFilterEnum) => void;
    className?: string;
}

export const SelectSubscriptionFilter = ({
    statusFilter,
    demoFilter,
    onStatusFilterChange,
    onDemoFilterChange,
    className,
}: SelectSubscriptionFilterProps) => {
    const value =
        demoFilter !== TenantDemoFilterEnum.All
            ? `${DEMO_PREFIX}${demoFilter}`
            : `${STATUS_PREFIX}${statusFilter}`;

    const handleChange = (raw: string) => {
        if (raw.startsWith(DEMO_PREFIX)) {
            onDemoFilterChange(raw.slice(DEMO_PREFIX.length) as TenantDemoFilterEnum);
            onStatusFilterChange("");
        } else {
            onStatusFilterChange(raw.slice(STATUS_PREFIX.length) as SubscriptionStatusEnum | "");
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

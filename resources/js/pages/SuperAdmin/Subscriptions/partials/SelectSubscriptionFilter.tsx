import { SelectStatusKindFilter } from "@/components/SuperAdmin/SelectStatusKindFilter";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";

type SubscriptionStatusFilter = SubscriptionStatusEnum | "";

const STATUS_FILTERS: { label: string; value: SubscriptionStatusFilter }[] = [
    { label: "Todos",             value: "" },
    { label: "Activos",           value: SubscriptionStatusEnum.Active },
    { label: "Vencidos",          value: SubscriptionStatusEnum.Expired },
    { label: "Período de gracia", value: SubscriptionStatusEnum.Grace },
];

// Los negocios de pruebas no llevan suscripción, por eso aquí solo existe el filtro Demo.
const KIND_FILTERS: { label: string; value: TenantDemoFilterEnum }[] = [
    { label: "Demo", value: TenantDemoFilterEnum.Demo },
];

interface SelectSubscriptionFilterProps {
    statusFilter: SubscriptionStatusFilter;
    demoFilter: TenantDemoFilterEnum;
    onStatusFilterChange: (value: SubscriptionStatusFilter) => void;
    onDemoFilterChange: (value: TenantDemoFilterEnum) => void;
    className?: string;
}

export const SelectSubscriptionFilter = ({
    statusFilter,
    demoFilter,
    onStatusFilterChange,
    onDemoFilterChange,
    className,
}: SelectSubscriptionFilterProps) => (
    <SelectStatusKindFilter
        statusOptions={STATUS_FILTERS}
        kindOptions={KIND_FILTERS}
        status={statusFilter}
        kind={demoFilter}
        resetStatus=""
        onStatusChange={onStatusFilterChange}
        onKindChange={onDemoFilterChange}
        className={className}
    />
);

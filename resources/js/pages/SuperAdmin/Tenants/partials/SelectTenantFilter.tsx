import { SelectStatusKindFilter } from "@/components/SuperAdmin/SelectStatusKindFilter";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";

const STATUS_FILTERS: { label: string; value: TenantStatusEnum }[] = [
    { label: "Todos",      value: TenantStatusEnum.All },
    { label: "Activos",    value: TenantStatusEnum.Active },
    { label: "Inactivos",  value: TenantStatusEnum.Inactive },
    { label: "Eliminados", value: TenantStatusEnum.Deleted },
];

const KIND_FILTERS: { label: string; value: TenantDemoFilterEnum }[] = [
    { label: "Demo", value: TenantDemoFilterEnum.Demo },
    { label: "Pruebas", value: TenantDemoFilterEnum.Test },
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
}: SelectTenantFilterProps) => (
    <SelectStatusKindFilter
        statusOptions={STATUS_FILTERS}
        kindOptions={KIND_FILTERS}
        status={status}
        kind={demoFilter}
        resetStatus={TenantStatusEnum.All}
        onStatusChange={onStatusChange}
        onKindChange={onDemoFilterChange}
        className={className}
    />
);

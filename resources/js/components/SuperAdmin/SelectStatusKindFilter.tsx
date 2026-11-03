import { Select } from "@/components/ui/form/Select";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";

const STATUS_PREFIX = "status:";
const KIND_PREFIX = "kind:";

interface IFilterOption<T extends string> {
    label: string;
    value: T;
}

interface SelectStatusKindFilterProps<TStatus extends string> {
    statusOptions: IFilterOption<TStatus>[];
    kindOptions: IFilterOption<TenantDemoFilterEnum>[];
    status: TStatus;
    kind: TenantDemoFilterEnum;
    // Estado que se aplica al elegir un tipo (demo, pruebas): los dos filtros son excluyentes.
    resetStatus: TStatus;
    onStatusChange: (value: TStatus) => void;
    onKindChange: (value: TenantDemoFilterEnum) => void;
    className?: string;
}

// Un solo desplegable que combina el filtro por estado y el filtro por tipo de cliente (demo, pruebas).
// Base de SelectTenantFilter y SelectSubscriptionFilter.
export const SelectStatusKindFilter = <TStatus extends string>({
    statusOptions,
    kindOptions,
    status,
    kind,
    resetStatus,
    onStatusChange,
    onKindChange,
    className,
}: SelectStatusKindFilterProps<TStatus>) => {
    const options = [
        ...statusOptions.map((o) => ({ value: `${STATUS_PREFIX}${o.value}`, label: o.label })),
        ...kindOptions.map((o) => ({ value: `${KIND_PREFIX}${o.value}`, label: o.label })),
    ];

    const value = kind !== TenantDemoFilterEnum.All ? `${KIND_PREFIX}${kind}` : `${STATUS_PREFIX}${status}`;

    const handleChange = (raw: string) => {
        if (raw.startsWith(KIND_PREFIX)) {
            onKindChange(raw.slice(KIND_PREFIX.length) as TenantDemoFilterEnum);
            onStatusChange(resetStatus);
        } else {
            onStatusChange(raw.slice(STATUS_PREFIX.length) as TStatus);
            onKindChange(TenantDemoFilterEnum.All);
        }
    };

    return (
        <Select<{ filter: string }>
            name="filter"
            options={options}
            value={value}
            onChange={handleChange}
            className={className}
        />
    );
};

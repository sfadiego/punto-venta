import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";

interface ITenantKindFlags {
    isDemo?: boolean;
    isTest?: boolean;
}

/** Convierte el filtro por tipo de cliente en los parámetros is_demo / is_test del API (undefined = sin filtrar). */
export const filterToFlags = (filter: TenantDemoFilterEnum): ITenantKindFlags => ({
    isDemo: filter === TenantDemoFilterEnum.Demo ? true : undefined,
    isTest: filter === TenantDemoFilterEnum.Test ? true : undefined,
});

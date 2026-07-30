import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useAxios } from "@/hooks/useAxios";
import { usePermissions } from "@/hooks/usePermissions";
import { RoleEnum } from "@/enums/RoleEnum";

export const useAdminPage = () => {
    const { data: config, isLoading } = useGetBusinessConfig();
    const { features } = useAxios();
    const { hasRole } = usePermissions();
    const sellByWeight = features?.sell_by_weight ?? false;
    // Solo Admin puede editar la configuración del negocio. Un rol con permiso
    // "viewAdmin" otorgado ve la sección en modo de solo lectura.
    const isReadOnly = !hasRole(RoleEnum.Admin);

    return { config, isLoading, sellByWeight, isReadOnly };
};

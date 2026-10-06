import { RoleEnum } from "@/enums/RoleEnum";
import { useAxios } from "@/hooks/useAxios";
import { useModal } from "@/hooks/useModal";
import { usePermissions } from "@/hooks/usePermissions";

export const useAddonsButton = () => {
    const { features } = useAxios();
    const { hasRole } = usePermissions();
    const modal = useModal();

    // Toppings: solo restaurante/cafetería, y el catálogo lo administra únicamente el Admin
    // (el backend protege las escrituras con role.admin).
    const canManageAddons = features?.kitchen_view === true && hasRole(RoleEnum.Admin);

    return { canManageAddons, ...modal };
};

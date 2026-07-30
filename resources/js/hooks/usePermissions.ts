import { useAxios } from "@/hooks/useAxios";
import { RoleEnum } from "@/enums/RoleEnum";
import { Action, DEFAULT_ROLE_PERMISSIONS, isActionApplicable } from "@/utils/permissionUtils";

export const usePermissions = () => {
    const { user, features, rolePermissions } = useAxios();
    const rolId = user?.rol_id ?? RoleEnum.Employe;
    const isConfigurableRole = rolId !== RoleEnum.Admin && rolId !== RoleEnum.SuperAdmin;
    const roleOverride = isConfigurableRole ? rolePermissions?.[rolId] as Action[] | undefined : undefined;
    const basePermissions = roleOverride
        ? new Set<Action>(roleOverride)
        : DEFAULT_ROLE_PERMISSIONS[rolId] ?? DEFAULT_ROLE_PERMISSIONS[RoleEnum.Employe];

    const can = (action: Action): boolean => {
        if (!isActionApplicable(action, features)) return false;
        return basePermissions.has(action);
    };

    const hasRole = (...roles: RoleEnum[]): boolean =>
        roles.includes(rolId as RoleEnum);

    return { can, hasRole, rolId };
};

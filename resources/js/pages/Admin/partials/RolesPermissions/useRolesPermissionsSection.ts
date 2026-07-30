import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RoleEnum } from "@/enums/RoleEnum";
import { Action, DEFAULT_ROLE_PERMISSIONS, getApplicableActions } from "@/utils/permissionUtils";
import { useAxios } from "@/hooks/useAxios";
import { useIndexRolePermissions, useUpdateRolePermission } from "@/services/useRolePermissionService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

const ALL_CONFIGURABLE_ROLES = [RoleEnum.Employe, RoleEnum.Cocina, RoleEnum.Caja];

export const useRolesPermissionsSection = () => {
    const { features } = useAxios();
    // Cocina y Caja no existen como roles asignables en negocios de venta por peso —
    // ver useUsersPage.ts, que ya excluye estos mismos roles al crear usuarios.
    const sellByWeight = features?.sell_by_weight === true;
    const configurableRoles = sellByWeight ? [RoleEnum.Employe] : ALL_CONFIGURABLE_ROLES;
    const applicableActions = getApplicableActions(features);

    const [activeRole, setActiveRole] = useState<RoleEnum>(RoleEnum.Employe);
    const [draft, setDraft] = useState<Record<number, Action[]>>({});
    const { data: rolePermissions, isLoading } = useIndexRolePermissions();
    const { mutate: save, isPending: saving } = useUpdateRolePermission();

    useEffect(() => {
        if (!rolePermissions) return;
        const initial: Record<number, Action[]> = {};
        configurableRoles.forEach((role) => {
            initial[role] = (rolePermissions[role] as Action[] | undefined)
                ?? Array.from(DEFAULT_ROLE_PERMISSIONS[role]);
        });
        setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rolePermissions, sellByWeight]);

    useEffect(() => {
        if (!configurableRoles.includes(activeRole)) {
            setActiveRole(configurableRoles[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellByWeight]);

    const activeActions = new Set<Action>(draft[activeRole] ?? []);

    const toggle = (action: Action) => {
        setDraft((prev) => {
            const current = new Set<Action>(prev[activeRole] ?? []);
            if (current.has(action)) {
                current.delete(action);
            } else {
                current.add(action);
            }
            return { ...prev, [activeRole]: Array.from(current) };
        });
    };

    const handleSave = () => {
        save(
            { roleId: activeRole, permissions: draft[activeRole] ?? [] },
            {
                onSuccess: () => toast.success("Permisos guardados"),
                onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al guardar")),
            },
        );
    };

    const resetToDefault = () => {
        setDraft((prev) => ({
            ...prev,
            [activeRole]: Array.from(DEFAULT_ROLE_PERMISSIONS[activeRole]),
        }));
    };

    return {
        configurableRoles,
        applicableActions,
        activeRole,
        setActiveRole,
        activeActions,
        toggle,
        handleSave,
        resetToDefault,
        saving,
        isLoading,
    };
};

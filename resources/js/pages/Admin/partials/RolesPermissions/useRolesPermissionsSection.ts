import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RoleEnum } from "@/enums/RoleEnum";
import { Action, DEFAULT_ROLE_PERMISSIONS } from "@/hooks/usePermissions";
import { useIndexRolePermissions, useUpdateRolePermission } from "@/services/useRolePermissionService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const CONFIGURABLE_ROLES = [RoleEnum.Employe, RoleEnum.Cocina, RoleEnum.Caja];

export const useRolesPermissionsSection = () => {
    const [activeRole, setActiveRole] = useState<RoleEnum>(RoleEnum.Employe);
    const [draft, setDraft] = useState<Record<number, Action[]>>({});
    const { data: rolePermissions, isLoading } = useIndexRolePermissions();
    const { mutate: save, isPending: saving } = useUpdateRolePermission();

    useEffect(() => {
        if (!rolePermissions) return;
        const initial: Record<number, Action[]> = {};
        CONFIGURABLE_ROLES.forEach((role) => {
            initial[role] = (rolePermissions[role] as Action[] | undefined)
                ?? Array.from(DEFAULT_ROLE_PERMISSIONS[role]);
        });
        setDraft(initial);
    }, [rolePermissions]);

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

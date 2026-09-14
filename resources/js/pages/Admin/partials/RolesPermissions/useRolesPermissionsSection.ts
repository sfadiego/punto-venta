import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RoleEnum } from "@/enums/RoleEnum";
import { Action, DEFAULT_ROLE_PERMISSIONS, getApplicableActions } from "@/utils/permissionUtils";
import { getExcludedRoles } from "@/utils/businessRoles";
import { useAxios } from "@/hooks/useAxios";
import { useIndexRolePermissions, useUpdateRolePermission } from "@/services/useRolePermissionService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

const ALL_CONFIGURABLE_ROLES = [RoleEnum.Employe, RoleEnum.Cocina, RoleEnum.Caja];

export const useRolesPermissionsSection = () => {
    const { features } = useAxios();
    // Cocina y Caja no existen como roles asignables en negocios de venta por peso ni en
    // retail — ver useUsersPage.ts, que ya excluye estos mismos roles al crear usuarios con
    // el mismo criterio (getExcludedRoles()).
    const excludedRoles = getExcludedRoles(features);
    const configurableRoles = ALL_CONFIGURABLE_ROLES.filter((role) => !excludedRoles.includes(role));
    const applicableActions = getApplicableActions(features);
    const applicableActionsSet = new Set(applicableActions);
    // DEFAULT_ROLE_PERMISSIONS es una tabla estática (no sabe de features del tenant) — filtrar
    // por applicableActions antes de usarla como draft/reset evita que una clave como
    // "kitchenView" quede marcada (y se guarde al hacer submit) en un tenant sin cocina, aunque
    // su checkbox ni siquiera se renderice.
    const defaultPermissionsFor = (role: RoleEnum): Action[] =>
        Array.from(DEFAULT_ROLE_PERMISSIONS[role]).filter((action) => applicableActionsSet.has(action));

    const [activeRole, setActiveRole] = useState<RoleEnum>(RoleEnum.Employe);
    const [draft, setDraft] = useState<Record<number, Action[]>>({});
    const { data: rolePermissions, isLoading } = useIndexRolePermissions();
    const { mutate: save, isPending: saving } = useUpdateRolePermission();

    useEffect(() => {
        if (!rolePermissions) return;
        const initial: Record<number, Action[]> = {};
        configurableRoles.forEach((role) => {
            initial[role] = (rolePermissions[role] as Action[] | undefined)
                ?? defaultPermissionsFor(role);
        });
        setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rolePermissions, features?.sell_by_weight, features?.is_retail]);

    useEffect(() => {
        if (!configurableRoles.includes(activeRole)) {
            setActiveRole(configurableRoles[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [features?.sell_by_weight, features?.is_retail]);

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
            [activeRole]: defaultPermissionsFor(activeRole),
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

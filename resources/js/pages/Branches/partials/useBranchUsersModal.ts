import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useShowBranch, useSyncBranchUsers } from "@/services/useBranchService";
import { useIndexUsers } from "@/services/useUserService";
import { RoleEnum } from "@/enums/RoleEnum";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useBranchUsersModal = (branchId: number | null) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const { data: branchDetail, isLoading: isLoadingBranch } = useShowBranch(branchId ?? 0);
    // Límite alto: el picker necesita el catálogo completo de usuarios del tenant, no una
    // página — en la práctica un negocio tiene pocos usuarios (login), no cientos.
    const { data: usersPage, isLoading: isLoadingUsers } = useIndexUsers({ limit: 100 });
    const { mutateAsync: syncUsers, isPending } = useSyncBranchUsers(branchId ?? 0);

    // Admin ya tiene acceso a todas las sucursales sin necesidad de asignación — no tiene
    // sentido ofrecerlo en este picker (ver User::authorizedBranchIds() en el backend).
    const assignableUsers = (usersPage?.data ?? []).filter((u) => u.rol_id !== RoleEnum.Admin);

    useEffect(() => {
        setSelectedIds(branchDetail?.users?.map((u) => u.id) ?? []);
    }, [branchDetail]);

    const toggleUser = (userId: number) => {
        setSelectedIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const handleSave = async (onSuccess: () => void) => {
        try {
            await syncUsers({ user_ids: selectedIds });
            toast.success("Usuarios de la sucursal actualizados");
            onSuccess();
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, "Error al actualizar los usuarios de la sucursal"));
        }
    };

    return {
        assignableUsers,
        selectedIds,
        toggleUser,
        handleSave,
        isPending,
        isLoading: isLoadingBranch || isLoadingUsers,
    };
};

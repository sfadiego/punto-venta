import { Pencil, Trash2, Loader, Users, Power } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IBranch } from "@/models/IBranch";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useDeleteBranch, useUpdateBranch } from "@/services/useBranchService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface BranchTableActionsProps {
    branch: IBranch;
    onEdit: (branch: IBranch) => void;
    onManageUsers: (branch: IBranch) => void;
}

export const BranchTableActions = ({ branch, onEdit, onManageUsers }: BranchTableActionsProps) => {
    const queryClient = useQueryClient();
    const { mutate: updateBranch, isPending: isToggling } = useUpdateBranch(branch.id);
    const { mutateAsync: deleteBranch, isPending: isDeleting } = useDeleteBranch(branch.id);

    const invalidate = () => {
        queryClient.invalidateQueries({
            predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith(ApiRoutes.Branch),
        });
    };

    const handleToggleActive = async () => {
        const activating = !branch.active;

        const result = await Swal.fire({
            title: activating ? `¿Activar "${branch.name}"?` : `¿Desactivar "${branch.name}"?`,
            text: activating
                ? "Volverá a estar disponible en los selectores de sucursal."
                : "Dejará de estar disponible para abrir caja o asignarse a productos nuevos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: activating ? "Sí, activar" : "Sí, desactivar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        updateBranch(
            { name: branch.name, address: branch.address, phone: branch.phone, active: activating },
            {
                onSuccess: () => {
                    toast.success(activating ? "Sucursal activada" : "Sucursal desactivada");
                    invalidate();
                },
                onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al actualizar la sucursal")),
            },
        );
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: `¿Eliminar "${branch.name}"?`,
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        try {
            await deleteBranch({});
            invalidate();
            toast.success("Sucursal eliminada");
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, "Error al eliminar la sucursal"));
        }
    };

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={() => onManageUsers(branch)}
                title="Usuarios de la sucursal"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
            >
                <Users size={18} />
            </button>
            <button
                onClick={handleToggleActive}
                disabled={isToggling}
                title={branch.active ? "Desactivar sucursal" : "Activar sucursal"}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all disabled:opacity-50"
            >
                {isToggling ? <Loader size={18} className="animate-spin" /> : <Power size={18} />}
            </button>
            <button
                onClick={() => onEdit(branch)}
                title="Editar sucursal"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
            >
                <Pencil size={18} />
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Eliminar sucursal"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
            >
                {isDeleting ? <Loader size={18} className="animate-spin text-red-500" /> : <Trash2 size={18} />}
            </button>
        </div>
    );
};

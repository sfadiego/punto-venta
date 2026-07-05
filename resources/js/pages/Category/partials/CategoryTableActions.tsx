import { Pencil, Trash2, Loader } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { ICategory } from "@/models/ICategory";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useDeleteCategory } from "@/services/useCategoriesService";

interface CategoryTableActionsProps {
    category: ICategory;
    onEdit: (category: ICategory) => void;
}

export const CategoryTableActions = ({ category, onEdit }: CategoryTableActionsProps) => {
    const queryClient = useQueryClient();
    const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteCategory(category.id!);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "¿Eliminar categoría?",
            text: `"${category.nombre}" y todos sus datos asociados se eliminarán.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        await deleteCategory({});
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Category] });
        toast.success("Categoría eliminada");
    };

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={() => onEdit(category)}
                title="Editar categoría"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
            >
                <Pencil size={20} />
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Eliminar categoría"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
            >
                {isDeleting
                    ? <Loader size={20} className="animate-spin text-red-500" />
                    : <Trash2 size={20} />
                }
            </button>
        </div>
    );
};

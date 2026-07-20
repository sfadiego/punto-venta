import { Eye, Pencil, Trash2, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { ICustomer } from "@/models/ICustomer";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { useDeleteCustomer } from "@/services/useCustomerService";

interface CustomerTableActionsProps {
    customer: ICustomer;
    onEdit: (customer: ICustomer) => void;
}

export const CustomerTableActions = ({ customer, onEdit }: CustomerTableActionsProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mutateAsync: deleteCustomer, isPending: isDeleting } = useDeleteCustomer(customer.id);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "¿Eliminar cliente?",
            text: `"${customer.name}" se eliminará. Su historial de órdenes y pagos se conserva.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        await deleteCustomer({});
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Customer] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });
        toast.success("Cliente eliminado");
    };

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={() => navigate(AdminRoutes.CustomerDetail.replace(":id", String(customer.id)))}
                title="Ver detalle"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
            >
                <Eye size={20} />
            </button>
            <button
                onClick={() => onEdit(customer)}
                title="Editar cliente"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
            >
                <Pencil size={20} />
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Eliminar cliente"
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

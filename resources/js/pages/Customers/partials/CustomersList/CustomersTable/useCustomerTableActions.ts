import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { RoleEnum } from "@/enums/RoleEnum";
import { ICustomer } from "@/models/ICustomer";
import { invalidateCustomerQueries, useDeleteCustomer } from "@/services/useCustomerService";
import { usePermissions } from "@/hooks/usePermissions";

// Acciones de una fila de clientes: ver detalle, y (solo Admin) editar y eliminar con confirmación.
export const useCustomerTableActions = (customer: ICustomer) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasRole } = usePermissions();
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
        // Incluye "Clientes con adeudo" de Estadísticas: un cliente eliminado deja de contar.
        invalidateCustomerQueries(queryClient);
        toast.success("Cliente eliminado");
    };

    return {
        isAdmin: hasRole(RoleEnum.Admin),
        isDeleting,
        goToDetail: () => navigate(AdminRoutes.CustomerDetail.replace(":id", String(customer.id))),
        handleDelete,
    };
};

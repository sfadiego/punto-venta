import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IEmployee } from "@/models/IEmployee";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { RoleEnum } from "@/enums/RoleEnum";
import { useDeleteEmployee, useToggleEmployeeActive } from "@/services/useEmployeesService";
import { usePermissions } from "@/hooks/usePermissions";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useEmployeeTableActions = (employee: IEmployee) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasRole } = usePermissions();
    const isAdmin = hasRole(RoleEnum.Admin);
    const { mutateAsync: deleteEmployee, isPending: isDeleting } = useDeleteEmployee(employee.id);
    const { mutateAsync: toggleActive, isPending: isToggling } = useToggleEmployeeActive(employee.id);

    const invalidateEmployees = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Employee] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Employee}/list`] });
    };

    const goToDetail = () => {
        navigate(AdminRoutes.EmployeeDetail.replace(":id", String(employee.id)));
    };

    const handleToggleActive = async () => {
        try {
            await toggleActive({});
            invalidateEmployees();
            toast.success(employee.active ? "Empleado ocultado" : "Empleado visible nuevamente");
        } catch (error) {
            logUnexpectedError(error, "useEmployeeTableActions.handleToggleActive");
            toast.error(getUserFacingErrorMessage(error, "No se pudo actualizar el empleado"));
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "¿Eliminar empleado?",
            text: `"${employee.name}" se eliminará.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        await deleteEmployee({});
        invalidateEmployees();
        toast.success("Empleado eliminado");
    };

    return {
        isAdmin,
        isDeleting,
        isToggling,
        goToDetail,
        handleToggleActive,
        handleDelete,
    };
};

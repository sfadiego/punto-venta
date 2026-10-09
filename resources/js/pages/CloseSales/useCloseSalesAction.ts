import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useCloseSales } from "@/services/useOpenSalesService";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const useCloseSalesAction = (sistemaId: number | null, hasActiveOrders: boolean) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mutateAsync: closeSales, isPending: isClosing } = useCloseSales(sistemaId ?? 0);

    // `emptyReason`: solo al cerrar una caja sin ventas — el backend lo exige y lo guarda en la sesión.
    const handleClose = async (emptyReason?: string) => {
        if (hasActiveOrders) return;

        const result = await Swal.fire({
            title: "¿Cerrar caja?",
            text: emptyReason
                ? `Esta sesión no tuvo ventas. Se cerrará con el motivo: "${emptyReason}". No podrás registrar más órdenes.`
                : "Esta acción cerrará la sesión de ventas del día. No podrás registrar más órdenes.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, cerrar caja",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        try {
            await closeSales(emptyReason ? { empty_close_reason: emptyReason } : {});
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/active-sale`] });
            toast.success("Caja cerrada exitosamente");
            navigate("/");
        } catch (error) {
            logUnexpectedError(error, "useCloseSalesAction.handleClose");
            toast.error(getUserFacingErrorMessage(error, "Error al cerrar la caja"));
        }
    };

    return { isClosing, handleClose };
};

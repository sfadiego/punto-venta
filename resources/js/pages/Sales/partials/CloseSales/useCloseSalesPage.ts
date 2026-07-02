import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useGetActiveSale, useCloseSales, useCurrentTotalSale } from "@/services/useOpenSalesService";
import { useIndexOrder } from "@/services/useOrderService";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

export const useCloseSalesPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const { data: activeSale, isLoading: loadingSale } = useGetActiveSale();
    const sistemaId = activeSale?.id ?? null;

    const { data: totales, isLoading: loadingTotal } = useCurrentTotalSale(sistemaId ?? 0);
    const { mutateAsync: closeSales, isPending: isClosing } = useCloseSales(sistemaId ?? 0);

    const { data: activeOrdersPage } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: OrderStatusEnum.InProcess,
        limit: 1,
    });

    const activeOrdersCount = activeOrdersPage?.total ?? 0;
    const hasActiveOrders   = activeOrdersCount > 0;

    const efectivoInicio  = activeSale?.efectivo_caja_inicio ?? 0;
    const totalBruto      = totales?.bruto      ?? 0;
    const totalDomicilios = totales?.domicilios ?? 0;
    const totalNeto       = totales?.neto       ?? 0;
    const efectivoCierre  = efectivoInicio + totalNeto;

    const handleClose = async () => {
        if (hasActiveOrders) return;

        const result = await Swal.fire({
            title: "¿Cerrar caja?",
            text: "Esta acción cerrará la sesión de ventas del día. No podrás registrar más órdenes.",
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
            await closeSales({});
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/active-sale`] });
            toast.success("Caja cerrada exitosamente");
            navigate("/");
        } catch (error: any) {
            const msg = error?.response?.data?.message ?? "Error al cerrar la caja";
            toast.error(msg);
        }
    };

    return {
        activeSale,
        sistemaId,
        efectivoInicio,
        totalBruto,
        totalDomicilios,
        totalNeto,
        efectivoCierre,
        sellByWeight,
        hasActiveOrders,
        activeOrdersCount,
        isLoading: loadingSale || loadingTotal,
        isClosing,
        handleClose,
    };
};

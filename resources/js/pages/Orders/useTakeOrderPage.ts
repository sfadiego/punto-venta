import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { TakeOrderMobileTabEnum } from "@/enums/TakeOrderMobileTabEnum";

export const useTakeOrderPage = (loadingOrder: boolean, isError: boolean) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [mobileTab, setMobileTab] = useState<TakeOrderMobileTabEnum>(TakeOrderMobileTabEnum.Products);

    const handleBack = () => {
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        navigate(-1);
    };

    // Un id inválido, inexistente o de otro tenant llega aquí como isError
    // (el backend ya filtra por tenant vía TenantScope + route model binding).
    // Redirigimos en vez de dejar la pantalla de "Tomar pedido" vacía/rota.
    useEffect(() => {
        if (!loadingOrder && isError) {
            toast.error("La orden solicitada no existe o no está disponible");
            navigate(AdminRoutes.OrderList, { replace: true });
        }
    }, [loadingOrder, isError, navigate]);

    return { mobileTab, setMobileTab, handleBack };
};

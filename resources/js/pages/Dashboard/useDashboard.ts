import { useAxios } from "@/hooks/useAxios";
import { useInfiniteIndexOrder, useIndexOrder } from "@/services/useOrderService";
import { useGetActiveSale } from "@/services/useOpenSalesService";
import { useIndexProducts } from "@/services/useProductService";
import { useBestSeller } from "@/services/useStatisticsService";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { localDateString, formatOrderTime } from "@/utils/dateUtils";
import { getStatusStyle, getStatusLabel } from "@/utils/orderStatus";

export { getStatusStyle, getStatusLabel, formatOrderTime };


export const useDashboard = () => {
    const { sistemaId, features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    // Para carnicería se pasa null para deshabilitar el polling de órdenes activas
    const { data: ordersData, isLoading: ordersLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
        useInfiniteIndexOrder(sellByWeight ? null : sistemaId);


    // Solo para carnicería: conteo de ventas cerradas hoy
    const today = localDateString();
    const { data: todaySalesData } = useIndexOrder({
        sistema_id: sellByWeight ? sistemaId : null,
        estatus_pedido_id: OrderStatusEnum.Closed,
        fecha: today,
        limit: 1,
    });

    const { data: activeSale } = useGetActiveSale();
    const { data: productsData } = useIndexProducts({ page: 1, limit: 1 });
    const { data: bestSellers = [] } = useBestSeller();

    const orders: IOrder[] = ordersData?.pages.flatMap((page) => page.data ?? []) ?? [];

    const topProduct      = bestSellers[0] ?? null;
    const ordenesActivas  = ordersData?.pages[0]?.total ?? 0;
    const ventasHoy       = todaySalesData?.total ?? 0;
    const totalProductos  = productsData?.total ?? 0;
    const cajaAbierta     = !!sistemaId;
    const horaApertura    = activeSale?.created_at ? formatOrderTime(activeSale.created_at) : null;

    const statSegundoWidget = sellByWeight
        ? {
            title: "Ventas hoy",
            value: String(ventasHoy),
            trend: ventasHoy === 1 ? "1 venta cerrada" : `${ventasHoy} ventas cerradas`,
            up: ventasHoy > 0,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            icon: "ShoppingCart",
        }
        : {
            title: "Órdenes activas",
            value: String(ordenesActivas),
            trend: ordenesActivas === 1 ? "1 en proceso" : `${ordenesActivas} en proceso`,
            up: ordenesActivas > 0,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            icon: "ShoppingCart",
        };

    const stats = [
        {
            title: "Más vendido",
            value: topProduct?.product ?? "—",
            trend: topProduct ? `${topProduct.total} unidades` : "Sin ventas",
            up: !!topProduct,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            icon: "Award",
        },
        statSegundoWidget,
        {
            title: "Productos",
            value: String(totalProductos),
            trend: totalProductos > 0 ? "registrados en sistema" : "Sin productos",
            up: totalProductos > 0,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            icon: "Package",
        },
        {
            title: "Estado de caja",
            value: cajaAbierta ? "Abierta" : "Cerrada",
            trend: cajaAbierta && horaApertura ? `desde las ${horaApertura}` : "Sin sesión activa",
            up: cajaAbierta,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            icon: "Landmark",
        },
    ];

    return {
        orders,
        ordersLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        sistemaId,
        sellByWeight,
        stats,
    };
};

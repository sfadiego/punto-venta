import { useAxios } from "@/hooks/useAxios";
import { usePermissions } from "@/hooks/usePermissions";
import { useInfiniteIndexOrder } from "@/services/useOrderService";
import { useGetActiveSale } from "@/services/useOpenSalesService";
import { useIndexProducts } from "@/services/useProductService";
import { useBestSeller } from "@/services/useStatisticsService";
import { IOrder } from "@/models/IOrder";
import { formatOrderTime } from "@/utils/dateUtils";
import { getStatusStyle, getStatusLabel } from "@/utils/orderStatus";

export { getStatusStyle, getStatusLabel, formatOrderTime };


export const useDashboard = () => {
    // La sucursal activa se cambia desde el selector del sidebar (SwitchBranchModal), no
    // desde esta página — sistemaId/branchId ya vienen resueltos para la sucursal activa
    // de la sesión (ver fix en useAppLayout.ts).
    const { sistemaId, branchId: ownBranchId, features } = useAxios();
    const { can } = usePermissions();
    const sellByWeight = features?.sell_by_weight === true;
    const isRetail = features?.is_retail === true;
    const canViewProducts = can("viewProducts");

    const { data: activeSale } = useGetActiveSale(ownBranchId);

    // Para carnicería se pasa null para deshabilitar el polling de órdenes activas
    const { data: ordersData, isLoading: ordersLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
        useInfiniteIndexOrder(sellByWeight ? null : sistemaId);


    const { data: productsData } = useIndexProducts({ page: 1, limit: 1, enabled: canViewProducts });
    const { data: bestSellers = [] } = useBestSeller(undefined, undefined, undefined, ownBranchId ?? undefined);

    const orders: IOrder[] = ordersData?.pages.flatMap((page) => page.data ?? []) ?? [];

    const topProduct      = bestSellers[0] ?? null;
    const ordenesActivas  = ordersData?.pages[0]?.total ?? 0;
    const totalProductos  = productsData?.total ?? 0;
    const cajaAbierta     = !!sistemaId;
    const horaApertura    = activeSale?.created_at ? formatOrderTime(activeSale.created_at) : null;

    const activeOrdersWidget = {
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
        ...(sellByWeight || !cajaAbierta ? [] : [activeOrdersWidget]),
        ...(canViewProducts
            ? [{
                title: "Productos",
                value: String(totalProductos),
                trend: totalProductos > 0 ? "registrados en sistema" : "Sin productos",
                up: totalProductos > 0,
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                icon: "Package",
            }]
            : []),
    ];

    return {
        orders,
        ordersLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        sistemaId,
        sellByWeight,
        isRetail,
        ownBranchId,
        horaApertura,
        stats,
    };
};

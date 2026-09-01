import { useMemo, useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useDataTable, DataTableRenderersMap } from "@/hooks/useDatatable";
import { useIndexOrder } from "@/services/useOrderService";
import { IOrder } from "@/models/IOrder";
import { getStatusStyle, getActiveStatuses } from "@/utils/orderStatus";
import { formatOrderTime } from "@/utils/dateUtils";
import { DataTableColumn } from "mantine-datatable";
import { Bike } from "lucide-react";
import { OrderActionButtons } from "@/components/orders/OrderActions/OrderActionButtons";
import { SaleActions } from "@/components/orders/OrderActions/SaleActions";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { PaymentOrCreditBadge } from "@/components/orders/PaymentOrCreditBadge";
import { calcOrderDisplayTotal } from "@/utils/deliveryCalc";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

const renderersMap: DataTableRenderersMap = {
    nombre_pedido: (o: IOrder) => (
        <span className="flex items-center gap-1.5">
            {o.nombre_pedido}
            {!!o.is_delivery && (
                <span title="Domicilio" className="shrink-0">
                    <Bike size={14} className="text-blue-500" />
                </span>
            )}
        </span>
    ),
    total: (o: IOrder) => formatCurrencyTrimmed(calcOrderDisplayTotal(o)),
    subtotal: (o: IOrder) => formatCurrencyTrimmed(o.subtotal),
    descuento: (o: IOrder) => (o.descuento > 0 ? `${o.descuento}%` : "—"),
    payment_method: (o: IOrder) => <PaymentOrCreditBadge order={o} />,
    created_at: (o: IOrder) => formatOrderTime(o.created_at),
    estatus_pedido_id: (o: IOrder) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(o.estatus_pedido_id)}`}>
            {o.status?.nombre ?? o.estatus_pedido_id}
        </span>
    ),
};

const actionsColumn: DataTableColumn<IOrder> = {
    accessor: "_acciones" as keyof IOrder,
    title: "Acciones",
    width: 200,
    render: (order: IOrder) => <OrderActionButtons order={order} />,
};

const ventaPorPesoActionsColumn: DataTableColumn<IOrder> = {
    accessor: "_acciones" as keyof IOrder,
    title: "",
    width: 110,
    textAlign: "center",
    render: (order: IOrder) => <SaleActions order={order} />,
};

export const useOrderList = () => {
    const { sistemaId, features } = useAxios();
    const showOrderServed = features?.order_served !== false;
    const sellByWeight = features?.sell_by_weight === true;
    // "Pedidos" aplica a venta por peso y Retail (ambos sin kitchen_view); "Órdenes" solo a
    // Restaurante (servicio en mesa). No usar sellByWeight aquí: Retail comparte sellByWeight=false
    // con Restaurante, así que no distingue entre ambos.
    const kitchenView = features?.kitchen_view === true;
    const defaultStatuses = sellByWeight
        ? String(OrderStatusEnum.InProcess)
        : getActiveStatuses(showOrderServed);

    const [estatusId, setEstatusId] = useState<string>(defaultStatuses);
    const [search, setSearch] = useState("");

    const { dataTableProps, isLoading, isFetching, refetch, setPage } = useDataTable({
        service: useIndexOrder,
        payload: {
            sistema_id: sistemaId,
            estatus_pedido_id: estatusId,
            search,
        },
        renderersMap,
    });

    const showingClosed = estatusId === String(OrderStatusEnum.Closed);

    const enhancedDataTableProps = useMemo(
        () => ({
            ...dataTableProps,
            columns:
                dataTableProps.columns.length > 0
                    ? ([
                          ...dataTableProps.columns.filter((col) => {
                              const accessor = col.accessor as string;
                              if (sellByWeight && accessor === "estatus_pedido_id") return false;
                              if (!showingClosed && accessor === "payment_method") return false;
                              return true;
                          }),
                          sellByWeight ? ventaPorPesoActionsColumn : actionsColumn,
                      ] as DataTableColumn<IOrder>[])
                    : [],
        }),
        [dataTableProps, sellByWeight, showingClosed],
    );

    const handleEstatusChange = (value: string) => {
        setEstatusId(value);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setEstatusId(defaultStatuses);
        setSearch("");
        setPage(1);
    };

    return {
        dataTableProps: enhancedDataTableProps,
        isLoading,
        isRefetching: isFetching && !isLoading,
        refetch,
        sistemaId,
        estatusId,
        search,
        showOrderServed,
        sellByWeight,
        kitchenView,
        handleEstatusChange,
        handleSearchChange,
        handleClearFilters,
    };
};

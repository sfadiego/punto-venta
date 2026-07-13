import { useMemo, useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useDataTable, DataTableRenderersMap } from "@/hooks/useDatatable";
import { useIndexOrder } from "@/services/useOrderService";
import { IOrder } from "@/models/IOrder";
import { getStatusStyle, formatOrderTime } from "@/pages/Dashboard/useDashboard";
import { DataTableColumn } from "mantine-datatable";
import { OrderActionButtons } from "@/components/orders/OrderActionButtons";
import { SaleActions } from "@/components/orders/SaleActions";
import { getActiveStatuses } from "./partials/OrderFilters";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { PaymentMethodBadge } from "@/components/orders/PaymentMethodBadge";

const renderersMap: DataTableRenderersMap = {
    total: (o: IOrder) => `$${o.total.toFixed(2)}`,
    subtotal: (o: IOrder) => `$${o.subtotal.toFixed(2)}`,
    descuento: (o: IOrder) => (o.descuento > 0 ? `${o.descuento}%` : "—"),
    payment_method: (o: IOrder) => <PaymentMethodBadge name={o.payment_method?.name} />,
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
    const defaultStatuses = sellByWeight
        ? String(OrderStatusEnum.InProcess)
        : getActiveStatuses(showOrderServed);

    const [estatusId, setEstatusId] = useState<string>(defaultStatuses);

    const { dataTableProps, isLoading, isFetching, refetch, setPage } = useDataTable({
        service: useIndexOrder,
        payload: {
            sistema_id: sistemaId,
            estatus_pedido_id: estatusId,
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

    const handleClearFilters = () => {
        setEstatusId(defaultStatuses);
        setPage(1);
    };

    return {
        dataTableProps: enhancedDataTableProps,
        isLoading,
        isRefetching: isFetching && !isLoading,
        refetch,
        sistemaId,
        estatusId,
        showOrderServed,
        sellByWeight,
        handleEstatusChange,
        handleClearFilters,
    };
};

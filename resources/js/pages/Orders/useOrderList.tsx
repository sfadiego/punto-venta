import { useMemo, useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useDataTable, DataTableRenderersMap } from "@/hooks/useDatatable";
import { useIndexOrder } from "@/services/useOrderService";
import { IOrder } from "@/models/IOrder";
import { getStatusStyle, formatOrderTime } from "@/pages/Dashboard/useDashboard";
import { DataTableColumn } from "mantine-datatable";
import { OrderActionButtons } from "@/components/orders/OrderActionButtons";
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal";
import { PrintTicketButton } from "@/components/orders/PrintTicketButton";
import { getActiveStatuses } from "./partials/OrderFilters";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

const renderersMap: DataTableRenderersMap = {
    total: (o: IOrder) => `$${o.total.toFixed(2)}`,
    subtotal: (o: IOrder) => `$${o.subtotal.toFixed(2)}`,
    descuento: (o: IOrder) => (o.descuento > 0 ? `${o.descuento}%` : "—"),
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
    width: 80,
    textAlign: "center",
    render: (order: IOrder) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            <OrderPreviewModal order={order} />
            <PrintTicketButton orderId={order.id} />
        </div>
    ),
};

export const useOrderList = () => {
    const { sistemaId, features } = useAxios();
    const showReadyToServe = features?.ready_to_serve !== false;
    const sellByWeight = features?.sell_by_weight === true;
    const defaultStatuses = sellByWeight
        ? String(OrderStatusEnum.Closed)
        : getActiveStatuses(showReadyToServe);

    const [estatusId, setEstatusId] = useState<string>(defaultStatuses);

    const { dataTableProps, isLoading, refetch, setPage } = useDataTable({
        service: useIndexOrder,
        payload: {
            sistema_id: sistemaId,
            estatus_pedido_id: estatusId,
        },
        renderersMap,
        refetchInterval: sellByWeight ? undefined : 10_000,
    });

    const enhancedDataTableProps = useMemo(
        () => ({
            ...dataTableProps,
            columns:
                dataTableProps.columns.length > 0
                    ? ([
                          ...dataTableProps.columns.filter((col) =>
                              sellByWeight
                                  ? (col.accessor as string) !== "estatus_pedido_id"
                                  : true,
                          ),
                          sellByWeight ? ventaPorPesoActionsColumn : actionsColumn,
                      ] as DataTableColumn<IOrder>[])
                    : [],
        }),
        [dataTableProps, sellByWeight],
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
        refetch,
        sistemaId,
        estatusId,
        showReadyToServe,
        sellByWeight,
        handleEstatusChange,
        handleClearFilters,
    };
};

import { useMemo, useState } from "react";
import { DataTableColumn } from "mantine-datatable";
import { Eye } from "lucide-react";
import { useDataTable, DataTableRenderersMap } from "@/hooks/useDatatable";
import { useIndexOrder } from "@/services/useOrderService";
import { useAxios } from "@/hooks/useAxios";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { getStatusStyle, getStatusLabel } from "@/utils/orderStatus";
import { useOrderDetailModal } from "./partials/OrderDetailModal/useOrderDetailModal";
import { PaymentMethodBadge } from "@/components/orders/PaymentMethodBadge";

import { getWeekStart, localDateString } from "@/utils/dateUtils";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";

const today = () => localDateString();
const currentMonth = () => today().slice(0, 7);

const renderersMap: DataTableRenderersMap = {
    total: (o: IOrder) => `$${o.total.toFixed(2)}`,
    subtotal: (o: IOrder) => `$${o.subtotal.toFixed(2)}`,
    descuento: (o: IOrder) => (o.descuento > 0 ? `${o.descuento}%` : "—"),
    payment_method: (o: IOrder) => <PaymentMethodBadge name={o.payment_method?.name} />,
    created_at: (o: IOrder) =>
        new Date(o.created_at).toLocaleString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
};

export const useSalesPage = () => {
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const [reportMode, setReportMode] = useState<SalesReportModeEnum>(SalesReportModeEnum.Day);
    const [fecha, setFecha] = useState<string | null>(today());
    const [semana, setSemana] = useState<string | null>(getWeekStart());
    const [mes, setMes] = useState<string | null>(currentMonth());
    const modal = useOrderDetailModal();

    const actionsColumn: DataTableColumn<IOrder> = useMemo(
        () => ({
            accessor: "_detalle" as keyof IOrder,
            title: "",
            width: 60,
            render: (order: IOrder) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        modal.open(order);
                    }}
                    disabled={order.total === 0}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600
                        hover:bg-amber-50 transition-colors disabled:opacity-40
                        disabled:cursor-not-allowed disabled:hover:bg-transparent
                        disabled:hover:text-stone-400"
                    title="Ver detalle"
                >
                    <Eye size={20} />
                </button>
            ),
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const { dataTableProps, isLoading, refetch, setPage } = useDataTable({
        service: useIndexOrder,
        payload: {
            estatus_pedido_id: OrderStatusEnum.Closed,
            ...(reportMode === SalesReportModeEnum.Day
                ? (fecha ? { fecha } : {})
                : reportMode === SalesReportModeEnum.Week
                    ? (semana ? { semana } : {})
                    : (mes ? { mes } : {})),
        },
        renderersMap,
    });

    const enhancedDataTableProps = useMemo(
        () => ({
            ...dataTableProps,
            columns:
                dataTableProps.columns.length > 0
                    ? ([
                        ...dataTableProps.columns.map((col) =>
                            (col.accessor as string) === "estatus_pedido_id"
                                ? {
                                    ...col,
                                    render: (o: IOrder) => (
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(o.estatus_pedido_id)}`}
                                        >
                                            {getStatusLabel(o.estatus_pedido_id)}
                                        </span>
                                    ),
                                }
                                : col,
                        ),
                        actionsColumn,
                    ] as DataTableColumn<IOrder>[])
                    : [],
        }),
        [dataTableProps, actionsColumn],
    );

    const handleReportModeChange = (mode: SalesReportModeEnum) => {
        setReportMode(mode);
        setPage(1);
    };

    const handleFechaChange = (value: string | null) => {
        setFecha(value);
        setPage(1);
    };

    const handleSemanaChange = (value: string | null) => {
        setSemana(value);
        setPage(1);
    };

    const handleMesChange = (value: string | null) => {
        setMes(value);
        setPage(1);
    };

    const handleClear = () => {
        setReportMode(SalesReportModeEnum.Day);
        setFecha(today());
        setSemana(getWeekStart());
        setMes(currentMonth());
        setPage(1);
    };

    return {
        dataTableProps: enhancedDataTableProps,
        isLoading,
        refetch,
        reportMode,
        fecha,
        semana,
        mes,
        sellByWeight,
        handleReportModeChange,
        handleFechaChange,
        handleSemanaChange,
        handleMesChange,
        handleClear,
        modal,
    };
};

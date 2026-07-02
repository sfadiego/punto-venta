import { useMemo, useState } from "react";
import { DataTableColumn } from "mantine-datatable";
import { Eye } from "lucide-react";
import { useDataTable, DataTableRenderersMap } from "@/hooks/useDatatable";
import { useIndexOrder } from "@/services/useOrderService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { useAxios } from "@/hooks/useAxios";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { getStatusStyle, getStatusLabel } from "@/pages/Dashboard/useDashboard";
import { useOrderDetailModal } from "./partials/useOrderDetailModal";

const today = () => new Date().toISOString().split("T")[0];

const renderersMap: DataTableRenderersMap = {
    total: (o: IOrder) => `$${o.total.toFixed(2)}`,
    subtotal: (o: IOrder) => `$${o.subtotal.toFixed(2)}`,
    descuento: (o: IOrder) => (o.descuento > 0 ? `${o.descuento}%` : "—"),
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

    const [fecha, setFecha] = useState<string | null>(today());
    const [categoriaId, setCategoriaId] = useState<number | null>(null);
    const modal = useOrderDetailModal();

    const { data: categories } = useIndexCategories();

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
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600
                        hover:bg-amber-50 transition-colors"
                    title="Ver detalle"
                >
                    <Eye size={16} />
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
            ...(fecha ? { fecha } : {}),
            ...(categoriaId !== null ? { categoria_id: categoriaId } : {}),
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

    const handleFechaChange = (value: string | null) => {
        setFecha(value);
        setPage(1);
    };

    const handleCategoriaChange = (id: number | null) => {
        setCategoriaId(id);
        setPage(1);
    };

    const handleClear = () => {
        setFecha(today());
        setCategoriaId(null);
        setPage(1);
    };

    return {
        dataTableProps: enhancedDataTableProps,
        isLoading,
        refetch,
        fecha,
        categoriaId,
        categories,
        sellByWeight,
        handleFechaChange,
        handleCategoriaChange,
        handleClear,
        modal,
    };
};

import { DataTable } from "mantine-datatable";
import { ClipboardList, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { useOrderList } from "./useOrderList";
import { OrderFilters } from "./partials/OrderFilters";
import { NewOrderButton } from "@/components/orders/NewOrderButton";
import { NewSaleButton } from "@/components/orders/NewSaleButton";
import { usePermissions } from "@/hooks/usePermissions";

const getRowClassName = ({ estatus_pedido_id }: IOrder): string => {
    if (estatus_pedido_id === OrderStatusEnum.ReadyToServe) return "!bg-blue-50";
    if (estatus_pedido_id === OrderStatusEnum.InProcess)    return "!bg-amber-50";
    return "";
};

export default function OrderListPage() {
    const navigate = useNavigate();
    const {
        dataTableProps,
        isLoading,
        refetch,
        sistemaId,
        estatusId,
        showReadyToServe,
        sellByWeight,
        handleEstatusChange,
        handleClearFilters,
    } = useOrderList();

    const { can } = usePermissions();

    return (
        <div className="px-5 py-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Órdenes</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {sistemaId ? `Sesión #${sistemaId}` : "Sin caja abierta"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500
                            hover:text-stone-700 bg-white border border-stone-200 px-3 py-2
                            rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>

                    {sistemaId && (sellByWeight ? <NewSaleButton /> : <NewOrderButton />)}
                </div>
            </div>

            {!sistemaId ? (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-16
                    flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                        <ClipboardList size={22} className="text-stone-300" />
                    </div>
                    <p className="text-stone-400 text-sm">No hay una caja abierta.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                    {!sellByWeight && (
                        <OrderFilters
                            estatusId={estatusId}
                            showReadyToServe={showReadyToServe}
                            onEstatusChange={handleEstatusChange}
                            onClear={handleClearFilters}
                        />
                    )}
                    <DataTable
                        fetching={isLoading}
                        {...dataTableProps}
                        {...(!sellByWeight && {
                            onRowClick: ({ record }: { record: IOrder }) => {
                                if (can("takeOrder")) navigate(`/take-order/${record.id}`);
                            },
                            rowStyle: () => ({ cursor: can("takeOrder") ? "pointer" : "default" }),
                        })}
                        rowClassName={(record: IOrder) => getRowClassName(record)}
                    />
                </div>
            )}
        </div>
    );
}

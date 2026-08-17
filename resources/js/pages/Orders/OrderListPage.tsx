import { DataTable } from "mantine-datatable";
import { ClipboardList, RefreshCw, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { useOrderList } from "./useOrderList";
import { OrderFilters } from "./partials/OrderFilters";
import { OrderSearch } from "./partials/OrderSearch";
import { NewOrderButton } from "@/components/orders/NewOrder/NewOrderButton";
import { NewSaleButton } from "@/components/orders/NewSaleButton";
import { ExpensesButton } from "@/components/orders/ExpensesButton";
import { usePermissions } from "@/hooks/usePermissions";
import { PendingOrdersSection } from "@/components/orders/PendingOrders/PendingOrdersSection";

const getRowClassName = ({ estatus_pedido_id }: IOrder): string => {
    if (estatus_pedido_id === OrderStatusEnum.Served) return "!bg-blue-50";
    if (estatus_pedido_id === OrderStatusEnum.InProcess) return "!bg-amber-50";
    return "";
};

export default function OrderListPage() {
    const navigate = useNavigate();
    const {
        dataTableProps,
        isLoading,
        isRefetching,
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
    } = useOrderList();

    const { can } = usePermissions();

    const handleRowClick = (order: IOrder) => {
        if (sellByWeight) {
            if (order.estatus_pedido_id === OrderStatusEnum.InProcess) {
                navigate(`${AdminRoutes.QuickSale}/${order.id}`);
            }
        } else if (can("takeOrder")) {
            navigate(`/take-order/${order.id}`);
        }
    };

    return (
        <div className="px-5 py-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-stone-900">{kitchenView ? "Órdenes" : "Pedidos"}</h1>
                        {isRefetching && (
                            <Loader size={16} className="animate-spin text-amber-400" />
                        )}
                    </div>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {sistemaId ? `Sesión #${sistemaId}` : "Sin caja abierta"}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500
                            hover:text-stone-700 bg-white border border-stone-200 px-3 py-2
                            rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        
                        <span className="hidden md:inline lg:inline">Actualizar</span>
                    </button>

                    {sistemaId && can("registerExpense") && <ExpensesButton />}
                    {sistemaId && (sellByWeight ? <NewSaleButton /> : <NewOrderButton />)}
                </div>
            </div>

            {sistemaId && can("managePendingOrders") && <PendingOrdersSection />}

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
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
                        <div className="flex-1 min-w-[220px] lg:max-w-sm">
                            <OrderSearch value={search} onChange={handleSearchChange} />
                        </div>
                        <div className="lg:ml-auto">
                            <OrderFilters
                                estatusId={estatusId}
                                showOrderServed={showOrderServed}
                                onEstatusChange={handleEstatusChange}
                                onClear={handleClearFilters}
                            />
                        </div>
                    </div>
                    <DataTable
                        fetching={isLoading}
                        {...dataTableProps}
                        onRowClick={({ record }: { record: IOrder }) => handleRowClick(record)}
                        rowStyle={(record: IOrder) => ({
                            cursor:
                                sellByWeight
                                    ? record.estatus_pedido_id === OrderStatusEnum.InProcess
                                        ? "pointer"
                                        : "default"
                                    : can("takeOrder")
                                      ? "pointer"
                                      : "default",
                        })}
                        rowClassName={(record: IOrder) => getRowClassName(record)}
                    />
                </div>
            )}
        </div>
    );
}

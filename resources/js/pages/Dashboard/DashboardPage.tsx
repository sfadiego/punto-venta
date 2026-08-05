import { useState } from "react";
import { Widget } from "@/components/dashboard/widgets/Widget";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import {
    Award, ShoppingCart, Package, Landmark,
    Lock, Unlock, LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "./useDashboard";
import { RecentOrders } from "./partials/RecentOrders/RecentOrders";
import { RecentSales } from "./partials/RecentSales/RecentSales";
import { NewOrderButton } from "@/components/orders/NewOrder/NewOrderButton";
import { NewSaleButton } from "@/components/orders/NewSaleButton";
import { ExpensesButton } from "@/components/orders/ExpensesButton";
import { SellByWeightSaleModal } from "./partials/SellByWeightSaleModal/SellByWeightSaleModal";
import { OpenSalesModal } from "./partials/OpenSalesModal/OpenSalesModal";
import { useOpenSalesModal } from "./partials/OpenSalesModal/useOpenSalesModal";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { IOrder } from "@/models/IOrder";
import { PendingOrdersSection } from "@/components/orders/PendingOrders/PendingOrdersSection";
import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";

const ICON_MAP: Record<string, LucideIcon> = {
    Award,
    ShoppingCart,
    Package,
    Landmark,
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const {
        orders, ordersLoading, isFetchingNextPage, hasNextPage, fetchNextPage, sistemaId, sellByWeight, stats,
    } = useDashboard();

    const {
        isOpen: openSalesOpen, openModal: openSales,
        handleClose: closeSales, formik: openSalesFormik, isPending: openSalesPending,
    } = useOpenSalesModal();

    const [resumeOrder, setResumeOrder] = useState<IOrder | null>(null);

    const cajaAbierta = !!sistemaId;

    const today = new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="px-5 py-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
                    <p className="text-stone-500 text-sm mt-0.5 capitalize">{today}</p>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
                    {cajaAbierta ? (
                        <>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                {
                                    can("registerExpense") &&
                                    <FeatureSpotlight
                                        featureKey={FeatureSpotlightKey.ExpensesButton}
                                        title="Registrar gasto"
                                        description="Registra un gasto para llevar un control de los egresos del negocio"
                                    >
                                        <ExpensesButton className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-600 font-medium px-3 sm:px-4 py-2.5 rounded-xl transition-colors text-sm w-full sm:w-auto" />
                                    </FeatureSpotlight>
                                }
                                {can("viewCloseSales") && (
                                    <button
                                        onClick={() => navigate(AdminRoutes.CloseSales)}
                                        className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-600 font-medium px-3 sm:px-4 py-2.5 rounded-xl transition-colors text-sm w-full sm:w-auto"
                                    >
                                        <Lock size={16} />
                                        <span className="hidden md:inline lg:inline">Cerrar caja</span>
                                    </button>
                                )}
                            </div>
                            {sellByWeight
                                ? <NewSaleButton className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm w-full sm:w-auto" />
                                : <NewOrderButton className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm w-full sm:w-auto" />
                            }
                        </>
                    ) : (
                        <button
                            onClick={openSales}
                            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm w-full sm:w-auto"
                        >
                            <Unlock size={16} />
                            Abrir caja
                        </button>
                    )}
                </div>
            </div>

            <SubscriptionBanner />
            {sistemaId && <PendingOrdersSection />}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {stats.map((stat) => (
                    <Widget
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        trend={stat.trend}
                        up={stat.up}
                        iconBg={stat.iconBg}
                        iconColor={stat.iconColor}
                        wicon={ICON_MAP[stat.icon]}
                    />
                ))}
            </div>
            <FeatureSpotlight
                featureKey={FeatureSpotlightKey.OrderListSection}
                title="Lista de Pedidos/Ordernes"
                description="La sección de lista de pedidos/ordenes, donde podrás visualizar las órdenes recientes y gestionar su estado de manera eficiente."
                variant="block"
                placement="top-start"
            >
                {sellByWeight ? (
                    <RecentSales onSelect={setResumeOrder} />
                ) : (
                    <RecentOrders
                        orders={orders}
                        isLoading={ordersLoading}
                        isFetchingNextPage={isFetchingNextPage}
                        hasNextPage={hasNextPage}
                        sistemaId={sistemaId}
                        onViewAll={() => navigate("/orders")}
                        onLoadMore={fetchNextPage}
                    />
                )}
            </FeatureSpotlight>
            <OpenSalesModal
                isOpen={openSalesOpen}
                isPending={openSalesPending}
                formik={openSalesFormik}
                onClose={closeSales}
            />

            {resumeOrder && (
                <SellByWeightSaleModal
                    initialOrder={resumeOrder}
                    onClose={() => setResumeOrder(null)}
                />
            )}
        </div>
    );
}

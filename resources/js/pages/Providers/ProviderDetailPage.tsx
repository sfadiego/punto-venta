import { ChevronLeft, Loader, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { useProviderDetailPage } from "./useProviderDetailPage";
import { ProviderPurchaseModal } from "./partials/ProviderPurchase/ProviderPurchaseModal";
import { ProviderPurchaseFilters } from "./partials/ProviderPurchase/ProviderPurchaseFilters";
import { ProviderPurchaseList } from "./partials/ProviderPurchase/ProviderPurchaseList";

export default function ProviderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const providerId = Number(id);

    const {
        provider,
        isLoading,
        purchases,
        isLoadingPurchases,
        purchaseFormik,
        isRegisteringPurchase,
        isPurchaseModalOpen,
        openPurchaseModal,
        closePurchaseModal,
        reportMode,
        setReportMode,
        fecha,
        setFecha,
        semana,
        setSemana,
        mes,
        setMes,
        handleClearFilters,
    } = useProviderDetailPage(providerId);

    if (isLoading || !provider) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <Loader size={20} className="animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(AdminRoutes.ProviderList)}
                        className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-stone-900 truncate">{provider.name}</h1>
                        {provider.phone && <p className="text-stone-500 text-sm mt-0.5">{provider.phone}</p>}
                    </div>
                </div>
                <button
                    onClick={openPurchaseModal}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200 shrink-0"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Registrar compra</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                <ProviderPurchaseFilters
                    reportMode={reportMode}
                    fecha={fecha}
                    semana={semana}
                    mes={mes}
                    onReportModeChange={setReportMode}
                    onFechaChange={setFecha}
                    onSemanaChange={setSemana}
                    onMesChange={setMes}
                    onClear={handleClearFilters}
                />

                <ProviderPurchaseList purchases={purchases} isLoading={isLoadingPurchases} />
            </div>

            <ProviderPurchaseModal
                isOpen={isPurchaseModalOpen}
                formik={purchaseFormik}
                isSubmitting={isRegisteringPurchase}
                onClose={closePurchaseModal}
            />
        </div>
    );
}

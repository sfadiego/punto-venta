import { AlertCircle } from "lucide-react";
import { useCloseSalesPage } from "./useCloseSalesPage";
import BestSellerWidget from "./BestSellerWidget";
import { SalesByCategoryButton, SalesByCategoryModal } from "@/pages/Sales/partials/SalesByCategoryModal/SalesByCategoryModal";
import { useSalesByCategoryModal } from "@/pages/Sales/partials/SalesByCategoryModal/useSalesByCategoryModal";
import { CloseSalesHeader } from "@/components/CloseSales/CloseSalesHeader";
import { CloseSalesSummaryCards } from "@/components/CloseSales/CloseSalesSummaryCards";
import { CloseSalesTotalBanner } from "@/components/CloseSales/CloseSalesTotalBanner";
import { CloseSalesSessionDetail } from "@/components/CloseSales/CloseSalesSessionDetail";
import { CloseSalesActiveOrdersAlert } from "@/components/CloseSales/CloseSalesActiveOrdersAlert";
import { CloseSalesCloseButton } from "@/components/CloseSales/CloseSalesCloseButton";

export default function CloseSalesPage() {
    const {
        activeSale,
        sistemaId,
        efectivoInicio,
        totalBruto,
        totalDomicilios,
        totalNeto,
        efectivoCierre,
        totalTransferenciaPagado,
        totalPropinas,
        totalPropinasTarjeta,
        sellByWeight,
        hasActiveOrders,
        activeOrdersCount,
        isLoading,
        isClosing,
        handleClose,
    } = useCloseSalesPage();

    const totalEnCaja = efectivoCierre + totalTransferenciaPagado;
    const categoryModal = useSalesByCategoryModal();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!activeSale) {
        return (
            <div className="px-5 py-6 max-w-3xl mx-auto">
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-4">
                    <AlertCircle size={48} className="text-stone-300" />
                    <p className="text-lg font-medium text-stone-500">No hay una caja abierta actualmente</p>
                    <p className="text-sm">Abre la caja desde el dashboard para registrar ventas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-6 max-w-3xl mx-auto">
            <CloseSalesHeader />

            <CloseSalesSummaryCards
                efectivoInicio={efectivoInicio}
                totalBruto={totalBruto}
                totalDomicilios={totalDomicilios}
                totalNeto={totalNeto}
                efectivoCierre={efectivoCierre}
                totalTransferenciaPagado={totalTransferenciaPagado}
                totalPropinas={totalPropinas}
                totalPropinasTarjeta={totalPropinasTarjeta}
                sellByWeight={sellByWeight}
            />

            <CloseSalesTotalBanner total={totalEnCaja} />

            <CloseSalesSessionDetail activeSale={activeSale} />

            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <BestSellerWidget sistemaId={sistemaId} />
                </div>
                {sellByWeight && (
                    <div className="shrink-0 pt-1">
                        <SalesByCategoryButton onClick={categoryModal.open} />
                    </div>
                )}
            </div>

            {hasActiveOrders && (
                <CloseSalesActiveOrdersAlert count={activeOrdersCount} />
            )}

            <CloseSalesCloseButton
                isClosing={isClosing}
                disabled={hasActiveOrders}
                onClick={handleClose}
            />

            <SalesByCategoryModal
                isOpen={categoryModal.isOpen}
                onClose={categoryModal.close}
                data={categoryModal.data}
                isLoading={categoryModal.isLoading}
                totalBruto={categoryModal.totalBruto}
                totalDomicilios={categoryModal.totalDomicilios}
                totalNeto={categoryModal.totalNeto}
                sistemaId={categoryModal.sistemaId}
            />
        </div>
    );
}

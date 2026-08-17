import { AlertCircle } from "lucide-react";
import { useCloseSalesPage } from "./useCloseSalesPage";
import BestSellerWidget from "./partials/BestSellerWidget";
import CreditCustomersWidget from "./partials/CreditCustomersWidget";
import CloseSalesCategoryReportWidget from "./partials/CloseSalesCategoryReportWidget";
import { SalesByCategoryModal } from "@/pages/Sales/partials/SalesByCategoryModal/SalesByCategoryModal";
import { useSalesByCategoryModal } from "@/pages/Sales/partials/SalesByCategoryModal/useSalesByCategoryModal";
import { CloseSalesHeader } from "@/components/CloseSales/CloseSalesHeader";
import { CloseSalesSummaryCardsRestaurant } from "@/components/CloseSales/SummaryCards/CloseSalesSummaryCardsRestaurant";
import { CloseSalesSummaryCardsSellByWeight } from "@/components/CloseSales/SummaryCards/CloseSalesSummaryCardsSellByWeight";
import { CloseSalesCashSummary } from "@/components/CloseSales/CashSummary/CloseSalesCashSummary";
import { CloseSalesTotalBanner } from "@/components/CloseSales/CashSummary/CloseSalesTotalBanner";
import { CloseSalesSessionDetail } from "@/components/CloseSales/CloseSalesSessionDetail";
import { CloseSalesExpensesModal } from "@/components/CloseSales/CashSummary/CloseSalesExpensesModal";
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
        totalGastos,
        efectivoCierre,
        totalEfectivoPagado,
        totalTransferenciaPagado,
        totalPropinas,
        totalPropinasTarjeta,
        expenses,
        isExpensesModalOpen,
        openExpensesModal,
        closeExpensesModal,
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

            {sellByWeight ? (
                <CloseSalesSummaryCardsSellByWeight
                    totalEfectivoPagado={totalEfectivoPagado}
                    totalNeto={totalNeto}
                    totalTransferenciaPagado={totalTransferenciaPagado}
                    totalPropinas={totalPropinas}
                    totalPropinasTarjeta={totalPropinasTarjeta}
                />
            ) : (
                <CloseSalesSummaryCardsRestaurant
                    totalNeto={totalNeto}
                    totalEfectivoPagado={totalEfectivoPagado}
                    totalTransferenciaPagado={totalTransferenciaPagado}
                    totalPropinas={totalPropinas}
                    totalPropinasTarjeta={totalPropinasTarjeta}
                />
            )}

            <CloseSalesCashSummary
                efectivoInicio={efectivoInicio}
                totalDomicilios={totalDomicilios}
                totalGastos={totalGastos}
                onViewExpenses={openExpensesModal}
            />

            <CloseSalesTotalBanner total={totalEnCaja} />
            
            {sellByWeight && (
                <CloseSalesCategoryReportWidget onOpen={categoryModal.open} />
            )}

            <BestSellerWidget sistemaId={sistemaId} />
            {/* Ventas a crédito hoy solo aplican a clientes de venta por peso — restaurante no
                maneja clientes todavía. */}
            {sellByWeight && <CreditCustomersWidget sistemaId={sistemaId} />}

            <CloseSalesSessionDetail activeSale={activeSale} />

            {hasActiveOrders && (
                <CloseSalesActiveOrdersAlert count={activeOrdersCount} />
            )}

            {totalBruto === 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3 text-sm mb-4">
                    <span className="shrink-0">⚠️</span>
                    <span>No hay ventas registradas en esta sesión. Registra al menos una venta para poder cerrar la caja.</span>
                </div>
            )}

            <CloseSalesCloseButton
                isClosing={isClosing}
                disabled={hasActiveOrders || totalBruto === 0}
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

            <CloseSalesExpensesModal
                isOpen={isExpensesModalOpen}
                expenses={expenses}
                onClose={closeExpensesModal}
            />
        </div>
    );
}

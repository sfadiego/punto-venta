import { useCloseSalesPage } from "./useCloseSalesPage";
import { CloseSalesLoader } from "./partials/CloseSalesLoader";
import { CloseSalesNoOpenSale } from "./partials/CloseSalesNoOpenSale";
import { CloseSalesReceipt } from "@/components/CloseSales/Receipt/CloseSalesReceipt";
import { CloseSalesExpensesModal } from "@/components/CloseSales/CashSummary/CloseSalesExpensesModal";
import { CloseSalesActiveOrdersAlert } from "@/components/CloseSales/CloseSalesActiveOrdersAlert";
import { CloseSalesCloseButton } from "@/components/CloseSales/CloseSalesCloseButton";
import { CloseSalesEmptySessionNotice } from "@/components/CloseSales/CloseSalesEmptySessionNotice";

export default function CloseSalesPage() {
    const {
        activeSale,
        efectivoInicio,
        totalDomicilios,
        totalNeto,
        totalGastos,
        layawaySummary,
        returnsSummary,
        efectivoCierre,
        totalEfectivoPagado,
        totalTransferenciaPagado,
        totalPropinas,
        totalPropinasTarjeta,
        totalPropinaEfectivo,
        expenses,
        isExpensesModalOpen,
        openExpensesModal,
        closeExpensesModal,
        sellByWeight,
        isRetail,
        isEmptySession,
        emptyReasonFormik,
        canClose,
        hasActiveOrders,
        activeOrdersCount,
        isLoading,
        isClosing,
        handleClose,
    } = useCloseSalesPage();

    if (isLoading) return <CloseSalesLoader />;

    if (!activeSale) return <CloseSalesNoOpenSale />;

    return (
        <div className="px-5 py-6 max-w-3xl mx-auto">
            <CloseSalesReceipt
                activeSale={activeSale}
                efectivoInicio={efectivoInicio}
                totalEfectivoPagado={totalEfectivoPagado}
                totalPropinaEfectivo={sellByWeight ? 0 : totalPropinaEfectivo}
                totalDomicilios={totalDomicilios}
                totalGastos={totalGastos}
                efectivoCierre={efectivoCierre}
                totalTransferenciaPagado={totalTransferenciaPagado}
                totalPropinas={totalPropinas}
                totalPropinasTarjeta={totalPropinasTarjeta}
                totalNeto={totalNeto}
                sellByWeight={sellByWeight}
                isRetail={isRetail}
                layawaySummary={layawaySummary}
                returnsSummary={returnsSummary}
                onViewExpenses={openExpensesModal}
            />

            {hasActiveOrders && (
                <CloseSalesActiveOrdersAlert count={activeOrdersCount} />
            )}

            {isEmptySession && <CloseSalesEmptySessionNotice formik={emptyReasonFormik} />}

            <div className="mb-8">
                <CloseSalesCloseButton
                    isClosing={isClosing}
                    disabled={!canClose}
                    onClick={handleClose}
                />
            </div>

            <CloseSalesExpensesModal
                isOpen={isExpensesModalOpen}
                expenses={expenses}
                onClose={closeExpensesModal}
            />
        </div>
    );
}

import { usePermissions } from "@/hooks/usePermissions";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { isCustomersModuleEnabled } from "@/utils/customersModule";
import { useAxios } from "@/hooks/useAxios";
import { useCloseSalesPage } from "./useCloseSalesPage";
import BestSellerWidget from "./partials/BestSellerWidget";
import CreditCustomersWidget from "./partials/CreditCustomersWidget";
import CloseSalesCategoryReportWidget from "./partials/CloseSalesCategoryReportWidget";
import { CloseSalesLoader } from "./partials/CloseSalesLoader";
import { CloseSalesNoOpenSale } from "./partials/CloseSalesNoOpenSale";
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
import { CloseSalesEmptySessionNotice } from "@/components/CloseSales/CloseSalesEmptySessionNotice";

export default function CloseSalesPage() {
    const {
        activeSale,
        sistemaId,
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
        expenses,
        isExpensesModalOpen,
        openExpensesModal,
        closeExpensesModal,
        sellByWeight,
        showDelivery,
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

    const totalEnCaja = efectivoCierre + totalTransferenciaPagado;
    const { can } = usePermissions();
    const { features } = useAxios();
    const categoryModal = useSalesByCategoryModal();
    const { data: config } = useGetBusinessConfig();
    const customersEnabled = isCustomersModuleEnabled(features, config);

    if (isLoading) return <CloseSalesLoader />;

    if (!activeSale) return <CloseSalesNoOpenSale />;

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
                layawaySummary={layawaySummary}
                returnsSummary={returnsSummary}
                showLayaway={isRetail}
                onViewExpenses={openExpensesModal}
            />

            <CloseSalesTotalBanner total={totalEnCaja} showDelivery={showDelivery} />

            {sellByWeight && can("viewSales") && (
                <CloseSalesCategoryReportWidget onOpen={categoryModal.open} />
            )}

            <BestSellerWidget sistemaId={sistemaId} />
            {customersEnabled && <CreditCustomersWidget sistemaId={sistemaId} />}

            <CloseSalesSessionDetail activeSale={activeSale} />

            {hasActiveOrders && (
                <CloseSalesActiveOrdersAlert count={activeOrdersCount} />
            )}

            {isEmptySession && <CloseSalesEmptySessionNotice formik={emptyReasonFormik} />}

            <CloseSalesCloseButton
                isClosing={isClosing}
                disabled={!canClose}
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

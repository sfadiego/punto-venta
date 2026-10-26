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
import { CloseSalesReceipt } from "@/components/CloseSales/Receipt/CloseSalesReceipt";
import { CloseSalesExpensesModal } from "@/components/CloseSales/CashSummary/CloseSalesExpensesModal";
import { CloseSalesActiveOrdersAlert } from "@/components/CloseSales/CloseSalesActiveOrdersAlert";
import { CloseSalesSectionHeading } from "@/components/CloseSales/CloseSalesSectionHeading";
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

    const { can } = usePermissions();
    const { features } = useAxios();
    const categoryModal = useSalesByCategoryModal();
    const { data: config } = useGetBusinessConfig();
    const customersEnabled = isCustomersModuleEnabled(features, config);

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

            <section>
                <CloseSalesSectionHeading title="Más datos de la sesión" />

                {sellByWeight && can("viewSales") && (
                    <CloseSalesCategoryReportWidget onOpen={categoryModal.open} />
                )}

                <BestSellerWidget sistemaId={sistemaId} />
                {customersEnabled && <CreditCustomersWidget sistemaId={sistemaId} />}
            </section>

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

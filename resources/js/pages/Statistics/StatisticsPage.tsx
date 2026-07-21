import { useStatisticsPage } from "./useStatisticsPage";
import { StatisticsHeader } from "./partials/StatisticsHeader";
import { StatisticsSummaryCards } from "./partials/StatisticsSummaryCards";
import { StatisticsEmptyState } from "./partials/StatisticsEmptyState";
import { BestSellerSection } from "./partials/BestSellerSection";
import { TopDebtorsWidget } from "./partials/TopDebtorsWidget";

export default function StatisticsPage() {
    const {
        month,
        formattedMonth,
        bestSellers,
        isLoading,
        totalVentas,
        cajaAbierta,
        handleMonthChange,
        topProduct,
        totalLabel,
        sellByWeight,
    } = useStatisticsPage();

    return (
        <div className="px-5 py-6 max-w-5xl mx-auto">
            <StatisticsHeader formattedMonth={formattedMonth} month={month} onMonthChange={handleMonthChange} />

            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : bestSellers.length === 0 ? (
                <StatisticsEmptyState />
            ) : (
                <div className="space-y-5">
                    <StatisticsSummaryCards
                        cajaAbierta={cajaAbierta}
                        totalVentas={totalVentas}
                        topProduct={topProduct}
                        totalLabel={totalLabel}
                        rankingCount={bestSellers.length}
                    />

                    <BestSellerSection data={bestSellers} />
                </div>
            )}

            {sellByWeight && (
                <div className="mt-5">
                    <TopDebtorsWidget />
                </div>
            )}
        </div>
    );
}

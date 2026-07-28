import { TrendingUp, Banknote, CreditCard, HandCoins } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { CloseSalesSectionHeading } from "../CloseSalesSectionHeading";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesSummaryCardsRestaurantProps {
    totalNeto: number;
    totalEfectivoPagado: number;
    totalTransferenciaPagado: number;
    totalPropinas: number;
    totalPropinasTarjeta: number;
}

export const CloseSalesSummaryCardsRestaurant = ({
    totalNeto,
    totalEfectivoPagado,
    totalTransferenciaPagado,
    totalPropinas,
    totalPropinasTarjeta,
}: CloseSalesSummaryCardsRestaurantProps) => (
    <div className="mb-6">
        <CloseSalesSectionHeading title="Ventas del día" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard
                icon={<Banknote size={20} className="text-amber-600" />}
                iconBg="bg-amber-100"
                label="Ventas en efectivo"
                value={formatCurrency(totalEfectivoPagado)}
            />

            <SummaryCard
                icon={<CreditCard size={20} className="text-blue-600" />}
                iconBg="bg-blue-100"
                label="Transferencias"
                value={formatCurrency(totalTransferenciaPagado)}
                valueColor="text-blue-700"
            />

            <SummaryCard
                icon={<TrendingUp size={20} className="text-emerald-600" />}
                iconBg="bg-emerald-100"
                label="Ventas Totales"
                value={formatCurrency(totalNeto)}
                valueColor="text-emerald-700"
                className="sm:col-span-2"
            />

            {totalPropinas > 0 && (
                <div className="sm:col-span-2 bg-violet-50 border border-violet-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-violet-100 shrink-0">
                        <HandCoins size={20} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-500 font-medium">Propinas registradas</p>
                        <p className="text-xl font-bold text-violet-700 mt-0.5">
                            {formatCurrency(totalPropinas)}
                        </p>
                        {totalPropinasTarjeta > 0 && (
                            <p className="text-xs text-violet-500 mt-1">
                                {formatCurrency(totalPropinasTarjeta)} por tarjeta/transferencia — no aparece en el efectivo en caja
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);

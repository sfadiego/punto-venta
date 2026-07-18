import { DollarSign, TrendingUp, Banknote, CreditCard, HandCoins } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesSummaryCardsRestaurantProps {
    efectivoInicio: number;
    totalBruto: number;
    totalEfectivoPagado: number;
    totalTransferenciaPagado: number;
    totalPropinas: number;
    totalPropinasTarjeta: number;
}

export const CloseSalesSummaryCardsRestaurant = ({
    efectivoInicio,
    totalBruto,
    totalEfectivoPagado,
    totalTransferenciaPagado,
    totalPropinas,
    totalPropinasTarjeta,
}: CloseSalesSummaryCardsRestaurantProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SummaryCard
            icon={<DollarSign size={20} className="text-stone-500" />}
            iconBg="bg-stone-100"
            label="Efectivo inicial"
            value={formatCurrency(efectivoInicio)}
        />

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
            value={formatCurrency(totalBruto)}
            valueColor="text-emerald-700"
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
);

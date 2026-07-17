import { DollarSign, TrendingUp, Wallet, Bike, CreditCard, HandCoins } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesSummaryCardsProps {
    efectivoInicio: number;
    totalBruto: number;
    totalDomicilios: number;
    totalNeto: number;
    efectivoCierre: number;
    totalTransferenciaPagado: number;
    totalPropinas: number;
    totalPropinasTarjeta: number;
    sellByWeight: boolean;
}

export const CloseSalesSummaryCards = ({
    efectivoInicio,
    totalBruto,
    totalDomicilios,
    totalNeto,
    efectivoCierre,
    totalTransferenciaPagado,
    totalPropinas,
    totalPropinasTarjeta,
    sellByWeight,
}: CloseSalesSummaryCardsProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SummaryCard
            icon={<DollarSign size={20} className="text-blue-600" />}
            iconBg="bg-blue-100"
            label="Efectivo inicial"
            value={formatCurrency(efectivoInicio)}
        />

        <SummaryCard
            icon={<TrendingUp size={20} className="text-amber-600" />}
            iconBg="bg-amber-100"
            label="Ventas brutas"
            value={formatCurrency(totalBruto)}
        />

        {sellByWeight && (
            <SummaryCard
                icon={<Bike size={20} className="text-red-500" />}
                iconBg="bg-red-100"
                label="Domicilios"
                value={`-${formatCurrency(totalDomicilios)}`}
                valueColor="text-red-500"
            />
        )}

        {sellByWeight && (
            <SummaryCard
                icon={<TrendingUp size={20} className="text-violet-600" />}
                iconBg="bg-violet-100"
                label="Ingreso neto"
                value={formatCurrency(totalNeto)}
                valueColor="text-violet-700"
            />
        )}

        <SummaryCard
            icon={<Wallet size={20} className="text-emerald-600" />}
            iconBg="bg-emerald-100"
            label="Efectivo en caja"
            value={formatCurrency(efectivoCierre)}
            valueColor="text-emerald-700"
        />

        <SummaryCard
            icon={<CreditCard size={20} className="text-blue-600" />}
            iconBg="bg-blue-100"
            label="En transferencias"
            value={formatCurrency(totalTransferenciaPagado)}
            valueColor="text-blue-700"
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
                            {formatCurrency(totalPropinasTarjeta)} por tarjeta/transferencia — este monto no está en la caja física
                        </p>
                    )}
                </div>
            </div>
        )}
    </div>
);

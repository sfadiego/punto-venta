import { DollarSign, TrendingUp, Bike, CreditCard, Wallet } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesSummaryCardsSellByWeightProps {
    efectivoInicio: number;
    totalEfectivoPagado: number;
    totalDomicilios: number;
    totalTransferenciaPagado: number;
    totalNeto: number;
    totalPropinas: number;
    totalPropinasTarjeta: number;
}

export const CloseSalesSummaryCardsSellByWeight = ({
    efectivoInicio,
    totalEfectivoPagado,
    totalDomicilios,
    totalTransferenciaPagado,
    totalNeto,
    totalPropinas,
    totalPropinasTarjeta,
}: CloseSalesSummaryCardsSellByWeightProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SummaryCard
            icon={<DollarSign size={20} className="text-stone-500" />}
            iconBg="bg-stone-100"
            label="Efectivo inicial"
            value={formatCurrency(efectivoInicio)}
        />

        <SummaryCard
            icon={<TrendingUp size={20} className="text-amber-600" />}
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

        {totalDomicilios > 0 && (
            <SummaryCard
                icon={<Bike size={20} className="text-red-500" />}
                iconBg="bg-red-100"
                label="Domicilio"
                value={`-${formatCurrency(totalDomicilios)}`}
                valueColor="text-red-500"
                note="Gastos de envío"
            />
        )}

        {(totalPropinas > 0 || totalPropinasTarjeta > 0) && (
            <SummaryCard
                icon={<Wallet size={20} className="text-violet-500" />}
                iconBg="bg-violet-100"
                label="Propinas"
                value={formatCurrency(totalPropinas + totalPropinasTarjeta)}
                valueColor="text-violet-700"
            />
        )}

        <SummaryCard
            icon={<DollarSign size={20} className="text-emerald-600" />}
            iconBg="bg-emerald-100"
            label="Ventas Totales"
            value={formatCurrency(totalNeto)}
            valueColor="text-emerald-700"
        />
    </div>
);

import { DollarSign, TrendingUp, CreditCard, Wallet } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { CloseSalesSectionHeading } from "../CloseSalesSectionHeading";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesSummaryCardsSellByWeightProps {
    totalEfectivoPagado: number;
    totalTransferenciaPagado: number;
    totalNeto: number;
    totalPropinas: number;
    totalPropinasTarjeta: number;
}

export const CloseSalesSummaryCardsSellByWeight = ({
    totalEfectivoPagado,
    totalTransferenciaPagado,
    totalNeto,
    totalPropinas,
    totalPropinasTarjeta,
}: CloseSalesSummaryCardsSellByWeightProps) => (
    <div className="mb-6">
        <CloseSalesSectionHeading title="Ventas del día" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="sm:col-span-2"
            />
        </div>
    </div>
);

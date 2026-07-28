import { DollarSign, Bike, ReceiptText } from "lucide-react";
import { SummaryCard } from "../SummaryCards/SummaryCard";
import { CloseSalesSectionHeading } from "../CloseSalesSectionHeading";
import { CloseSalesExpensesButton } from "./CloseSalesExpensesButton";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesCashSummaryProps {
    efectivoInicio: number;
    totalDomicilios: number;
    totalGastos: number;
    onViewExpenses: () => void;
}

export const CloseSalesCashSummary = ({
    efectivoInicio,
    totalDomicilios,
    totalGastos,
    onViewExpenses,
}: CloseSalesCashSummaryProps) => (
    <div className="mb-6">
        <CloseSalesSectionHeading
            title="Efectivo en caja"
            subtitle="No afecta las ventas del día, solo el efectivo físico disponible"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard
                icon={<DollarSign size={20} className="text-stone-500" />}
                iconBg="bg-stone-100"
                label="Efectivo inicial"
                value={formatCurrency(efectivoInicio)}
            />

            {totalDomicilios > 0 && (
                <SummaryCard
                    icon={<Bike size={20} className="text-red-500" />}
                    iconBg="bg-red-100"
                    label="Domicilio"
                    value={`-${formatCurrency(totalDomicilios)}`}
                    valueColor="text-red-500"
                    note="Absorbido por el negocio, pagado en efectivo"
                />
            )}

            {totalGastos > 0 && (
                <SummaryCard
                    icon={<ReceiptText size={20} className="text-red-500" />}
                    iconBg="bg-red-100"
                    label="Gastos extra"
                    value={`-${formatCurrency(totalGastos)}`}
                    valueColor="text-red-500"
                    note="Compras del turno pagadas en efectivo"
                    action={<CloseSalesExpensesButton onClick={onViewExpenses} />}
                />
            )}
        </div>
    </div>
);

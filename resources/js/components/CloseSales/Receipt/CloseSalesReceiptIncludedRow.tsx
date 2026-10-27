import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesReceiptIncludedRowProps {
    label: string;
    amount: number;
}

export const CloseSalesReceiptIncludedRow = ({ label, amount }: CloseSalesReceiptIncludedRowProps) => (
    <li className="flex items-baseline justify-between gap-3 ml-3 pl-3 border-l-2 border-stone-200">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-stone-800">{formatCurrency(amount)}</span>
    </li>
);

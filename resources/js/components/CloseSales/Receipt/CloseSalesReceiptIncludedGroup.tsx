import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesReceiptIncludedGroupProps {
    title: string;
    amount: number;
}

export const CloseSalesReceiptIncludedGroup = ({ title, amount }: CloseSalesReceiptIncludedGroupProps) => (
    <li className="flex items-baseline justify-between gap-3 pt-2 font-medium text-stone-800 first:pt-0">
        <span>{title}</span>
        <span className="font-mono tabular-nums">{formatCurrency(amount)}</span>
    </li>
);

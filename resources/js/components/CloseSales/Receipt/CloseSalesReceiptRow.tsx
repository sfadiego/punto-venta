import { Eye } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { ReceiptRowSign } from "@/utils/closeSalesReceipt";

type CloseSalesReceiptRowVariant = "line" | "subtotal" | "info";

interface CloseSalesReceiptRowProps {
    label: string;
    amount: number;
    sign?: ReceiptRowSign;
    note?: string;
    variant?: CloseSalesReceiptRowVariant;
    onViewDetail?: () => void;
}

const SIGN_SYMBOL: Record<ReceiptRowSign, string> = { plus: "+", minus: "−", none: "" };

const ROW_STYLE: Record<CloseSalesReceiptRowVariant, string> = {
    line: "border-b border-dotted border-stone-200 py-3",
    subtotal: "border-y-2 border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_14%,white)] px-3 -mx-3 py-3 font-bold",
    info: "border-b border-dotted border-stone-200 py-3 text-stone-500",
};

const AMOUNT_STYLE: Record<CloseSalesReceiptRowVariant, string> = {
    line: "text-base sm:text-lg",
    subtotal: "text-xl sm:text-2xl",
    info: "text-base",
};

export const CloseSalesReceiptRow = ({
    label,
    amount,
    sign = "none",
    note,
    variant = "line",
    onViewDetail,
}: CloseSalesReceiptRowProps) => (
    <li className={`flex items-baseline justify-between gap-3 ${ROW_STYLE[variant]}`}>
        <div className="min-w-0">
            <p className="text-sm sm:text-base">
                <span className="inline-block w-3 mr-2 font-mono text-stone-400">
                    {variant === "subtotal" ? "=" : SIGN_SYMBOL[sign]}
                </span>
                {label}
            </p>
            {note && <p className="text-xs font-normal text-stone-500 mt-0.5 pl-5">{note}</p>}
            {onViewDetail && (
                <button
                    type="button"
                    onClick={onViewDetail}
                    className="mt-1 ml-5 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                    <Eye size={14} />
                    Ver detalle
                </button>
            )}
        </div>
        <p
            className={`shrink-0 font-mono tabular-nums whitespace-nowrap ${AMOUNT_STYLE[variant]} ${
                sign === "minus" ? "text-red-600" : ""
            }`}
        >
            {formatCurrency(amount)}
        </p>
    </li>
);

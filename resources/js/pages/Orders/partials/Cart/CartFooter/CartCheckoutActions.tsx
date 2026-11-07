import { Lock, Banknote } from "lucide-react";
import { PrintTicketButton } from "@/components/orders/PrintTicket/PrintTicketButton";

interface CartCheckoutActionsProps {
    isReadOnly?: boolean;
    hasItems: boolean;
    canPay: boolean;
    disablePay: boolean;
    orderId: number;
    onPay: () => void;
    onBeforePrint: () => Promise<boolean>;
}

export const CartCheckoutActions = ({
    isReadOnly = false,
    hasItems,
    canPay,
    disablePay,
    orderId,
    onPay,
    onBeforePrint,
}: CartCheckoutActionsProps) => (
    <div className="space-y-2">
        {isReadOnly ? (
            <div className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-400 font-medium py-3 rounded-xl text-sm cursor-not-allowed">
                <Lock size={14} />
                Orden cerrada
            </div>
        ) : (
            <button
                onClick={onPay}
                disabled={!hasItems || !canPay || disablePay}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm shadow-emerald-200"
            >
                <Banknote size={16} />
                Pagar
            </button>
        )}
        <PrintTicketButton
            orderId={orderId}
            showLabel
            onBeforePrint={onBeforePrint}
            className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
        />
    </div>
);

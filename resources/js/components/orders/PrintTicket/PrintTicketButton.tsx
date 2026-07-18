import { Printer, Loader } from "lucide-react";
import { usePrintTicket } from "./usePrintTicket";

interface PrintTicketButtonProps {
    orderId: number;
    showLabel?: boolean;
    className?: string;
}

const defaultIconClass =
    "flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 " +
    "hover:text-stone-700 hover:bg-white border border-transparent " +
    "hover:border-stone-200 transition-all disabled:opacity-50";

const defaultLabelClass =
    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-stone-500 " +
    "hover:text-stone-700 hover:bg-white border border-transparent " +
    "hover:border-stone-200 transition-all text-xs font-medium disabled:opacity-50";

export const PrintTicketButton = ({
    orderId,
    showLabel = false,
    className,
}: PrintTicketButtonProps) => {
    const { print, isPending, isVisible } = usePrintTicket(orderId);

    if (!isVisible) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        print();
    };

    const resolvedClass = className ?? (showLabel ? defaultLabelClass : defaultIconClass);
    const iconSize = 20;

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            title="Imprimir ticket"
            className={resolvedClass}
        >
            {isPending
                ? <Loader size={iconSize} className="animate-spin" />
                : <Printer size={iconSize} />
            }
            {showLabel && <span className="hidden sm:inline">Imprimir</span>}
        </button>
    );
};

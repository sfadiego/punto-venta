import { useState } from "react";
import { Printer, Loader } from "lucide-react";
import { usePrintTicket } from "./usePrintTicket";

interface PrintTicketButtonProps {
    orderId: number;
    /** Imprime el comprobante de esta devolución en lugar del ticket de la orden. */
    returnId?: number;
    showLabel?: boolean;
    className?: string;
    /** Se espera antes de imprimir; si devuelve false no se imprime (ej. cambios del carrito sin enviar). */
    onBeforePrint?: () => Promise<boolean>;
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
    returnId,
    showLabel = false,
    className,
    onBeforePrint,
}: PrintTicketButtonProps) => {
    const { print, isPending, isVisible } = usePrintTicket();
    const [isWaiting, setIsWaiting] = useState(false);

    if (!isVisible) return null;

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onBeforePrint) {
            setIsWaiting(true);
            try {
                if (!(await onBeforePrint())) return;
            } finally {
                setIsWaiting(false);
            }
        }
        print(orderId, returnId);
    };

    const isBusy = isPending || isWaiting;

    const resolvedClass = className ?? (showLabel ? defaultLabelClass : defaultIconClass);
    const iconSize = 20;

    return (
        <button
            onClick={handleClick}
            disabled={isBusy}
            title={returnId ? "Imprimir comprobante de devolución" : "Imprimir ticket"}
            className={resolvedClass}
        >
            {isBusy
                ? <Loader size={iconSize} className="animate-spin" />
                : <Printer size={iconSize} />
            }
            {showLabel && <span className="hidden sm:inline">Imprimir</span>}
        </button>
    );
};

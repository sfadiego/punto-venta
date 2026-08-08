import { ChevronUp, Pencil, Banknote, Printer, Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { usePrintTicket } from "@/components/orders/PrintTicket/usePrintTicket";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { TicketDrawer } from "./TicketDrawer";

const printButtonClass =
    "flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-stone-500 " +
    "hover:text-stone-700 hover:bg-white border border-stone-200 transition-all disabled:opacity-50";

export const TicketBar = () => {
    const {
        cart,
        total,
        isDrawerOpen,
        toggleDrawer,
        openPayModal,
        nombrePedido,
        setNombrePedido,
        handleNombrePedidoBlur,
        domicilioActivo,
        domicilioNum,
        ensureOrderForPrint,
        isPreparingPrint,
    } = useQuickSaleContext();
    const { print, isPending: isPrinting, isVisible: printVisible } = usePrintTicket();
    const hasAnything = cart.length > 0 || (domicilioActivo && domicilioNum > 0);

    const handlePrint = async () => {
        if (!hasAnything) return;
        const orderId = await ensureOrderForPrint();
        print(orderId);
    };

    return (
        <footer className="shrink-0 bg-white border-t border-stone-200">
            {isDrawerOpen && <TicketDrawer />}
            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-stone-50">
                <button type="button" onClick={toggleDrawer} className="flex items-center gap-3 text-stone-700 shrink-0">
                    <ChevronUp size={18} className={`text-stone-400 transition-transform ${isDrawerOpen ? "rotate-180" : ""}`} />
                    <span className="text-sm text-stone-400">
                        {cart.length === 0 ? "Ticket vacío" : `${cart.length} ${cart.length === 1 ? "producto" : "productos"}`}
                    </span>
                    <span className="text-lg font-bold text-stone-900 tabular-nums">{formatCurrencyTrimmed(total)}</span>
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <div className="hidden sm:flex items-center gap-1.5 w-80 bg-white border border-stone-200 rounded-lg px-2.5 py-2 min-w-0">
                        <Pencil size={13} className="shrink-0 text-stone-400" />
                        <Input
                            name="nombrePedido"
                            placeholder="Nombre (opcional)"
                            value={nombrePedido}
                            onChange={(e) => setNombrePedido(e.target.value)}
                            onBlur={handleNombrePedidoBlur}
                            inputStyle="none"
                            className="!w-full !px-0 !py-0 !border-0 !bg-transparent !text-sm !font-medium !text-stone-700 placeholder:!text-stone-400 focus:!ring-0"
                        />
                    </div>
                    {printVisible && (
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={!hasAnything || isPrinting || isPreparingPrint}
                            title="Imprimir ticket"
                            className={printButtonClass}
                        >
                            {isPrinting || isPreparingPrint
                                ? <Loader size={20} className="animate-spin" />
                                : <Printer size={20} />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={openPayModal}
                        disabled={!hasAnything}
                        className="shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm shadow-amber-200"
                    >
                        <Banknote size={16} />
                        Cobrar
                    </button>
                </div>
            </div>
        </footer>
    );
};

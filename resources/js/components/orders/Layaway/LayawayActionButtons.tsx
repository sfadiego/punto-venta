import { Ban } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { LayawayCancelModal } from "./Cancel/LayawayCancelModal";
import { LayawayPaymentModal } from "./Payment/LayawayPaymentModal";
import { useLayawayActions } from "./useLayawayActions";

interface LayawayActionButtonsProps {
    order: IOrder;
}

// "Abonar" y "Cancelar" de un apartado activo — compartido entre el listado de Órdenes y el
// detalle de cliente. No renderiza nada si la orden ya no es un apartado activo o el usuario
// no tiene el permiso `layaway`.
export const LayawayActionButtons = ({ order }: LayawayActionButtonsProps) => {
    const { can } = usePermissions();
    const { canOperate, isPaymentOpen, openPayment, closePayment, isCancelOpen, openCancel, closeCancel } = useLayawayActions();

    if (order.estatus_pedido_id !== OrderStatusEnum.Layaway || !can("layaway")) return null;

    return (
        <>
            <button
                type="button"
                onClick={openPayment}
                disabled={!canOperate}
                title={canOperate ? "Registrar abono" : "Abre la caja para registrar abonos"}
                className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Abonar
            </button>
            <button
                type="button"
                onClick={openCancel}
                disabled={!canOperate}
                title="Cancelar apartado"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Ban size={18} />
            </button>

            {isPaymentOpen && <LayawayPaymentModal order={order} onClose={closePayment} />}
            {isCancelOpen && <LayawayCancelModal order={order} onClose={closeCancel} />}
        </>
    );
};

import { Modal } from "@mantine/core";
import { Gift } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { LayawayProductsList } from "./LayawayProductsList";

interface LayawayProductsModalProps {
    order: IOrder;
    onClose: () => void;
}

// Lista completa de lo apartado, con scroll — para apartados con muchos productos, donde la lista
// en línea haría crecer demasiado la tarjeta. Se monta solo mientras está abierto.
export const LayawayProductsModal = ({ order, onClose }: LayawayProductsModalProps) => {
    const products = order.order_products ?? [];

    return (
        <Modal
            opened
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Gift size={18} className="text-amber-500" />
                    <span className="font-semibold text-stone-800">Productos del apartado #{order.id}</span>
                </div>
            }
            size="lg"
            radius="lg"
            padding="lg"
        >
            <div className="max-h-[60vh] overflow-y-auto pr-1">
                <LayawayProductsList orderProducts={products} />
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 mt-3 pt-3 text-sm">
                <span className="text-stone-500">{products.length} {products.length === 1 ? "producto" : "productos"}</span>
                <span className="font-bold text-stone-900 tabular-nums">Total {formatCurrencyTrimmed(order.total)}</span>
            </div>
        </Modal>
    );
};

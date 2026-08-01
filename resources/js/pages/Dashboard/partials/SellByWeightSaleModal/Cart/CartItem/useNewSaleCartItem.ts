import { useState } from "react";
import { IModalCartItem } from "@/models/IModalCartItem";
import { UNIDAD_LABELS, UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { formatMoney } from "@/utils/formatCurrency";

export const isPeso = (item: IModalCartItem) =>
    item.product.unidad_medida === UnidadMedidaEnum.Kg ||
    item.product.unidad_medida === UnidadMedidaEnum.Gr ||
    item.product.unidad_medida === UnidadMedidaEnum.Litro;

// Un scale físico solo mide masa (kg/gr) — no aplica a unidades de volumen como Litro.
export const isScaleWeighable = (item: IModalCartItem) =>
    item.product.unidad_medida === UnidadMedidaEnum.Kg ||
    item.product.unidad_medida === UnidadMedidaEnum.Gr;

interface UseNewSaleCartItemParams {
    item: IModalCartItem;
    onRemove: () => Promise<void>;
    onReadScale: () => Promise<void>;
}

export const useNewSaleCartItem = ({ item, onRemove, onReadScale }: UseNewSaleCartItemParams) => {
    const [isRemoving, setIsRemoving] = useState(false);
    const [isReadingScale, setIsReadingScale] = useState(false);

    const handleReadScale = async () => {
        if (isReadingScale) return;
        setIsReadingScale(true);
        try {
            await onReadScale();
        } finally {
            setIsReadingScale(false);
        }
    };

    const handleRemove = async () => {
        if (isRemoving) return;
        setIsRemoving(true);
        try {
            await onRemove();
        } catch {
            // error ya manejado y notificado en removeFromCart
        } finally {
            setIsRemoving(false);
        }
    };

    const canToggle = isPeso(item);
    const unitLabel = UNIDAD_LABELS[item.product.unidad_medida];
    const lineTotal = formatMoney(item.precioEfectivo * item.cantidad);

    return {
        isRemoving, handleRemove,
        isReadingScale, handleReadScale,
        canToggle, unitLabel, lineTotal,
    };
};

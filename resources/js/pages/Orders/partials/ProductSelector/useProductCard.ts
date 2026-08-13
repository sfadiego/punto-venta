import { useModal } from "@/hooks/useModal";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { getAvailableStock } from "@/utils/stock";

type OnAdd = (
    productId: number,
    name: string,
    price: number,
    variantId?: number | null,
    variantName?: string | null,
) => void | Promise<void>;

export const useProductCard = (product: IProduct, quantityInCart: number, onAdd: OnAdd) => {
    const { isOpen, openModal, closeModal } = useModal();
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;

    // Cuánto más se puede agregar de este producto: existencia total menos lo que ya está en
    // el carrito (sumando todas sus variantes). Sin manage_stock, getAvailableStock devuelve
    // Infinity y no hay tope — mismo patrón que Menu/QuickSale (ver useProductCard ahí).
    const availableStock = getAvailableStock(product);
    const isManagedStock = availableStock !== Infinity;
    const maxAddable = Math.max(0, availableStock - quantityInCart);
    const stockExhausted = isManagedStock && maxAddable <= 0;

    const handleClick = () => {
        if (stockExhausted) return;
        if (hasVariants) {
            openModal();
            return;
        }
        onAdd(product.id, product.nombre, product.precio);
    };

    const handleSelectVariant = (variant: IProductVariant) => {
        closeModal();
        onAdd(product.id, product.nombre, variant.precio, variant.id, variant.nombre);
    };

    return {
        isPickerOpen: isOpen,
        closePicker: closeModal,
        handleClick,
        handleSelectVariant,
        isManagedStock,
        stockExhausted,
    };
};

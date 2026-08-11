import { useModal } from "@/hooks/useModal";
import { IMenuProduct } from "@/models/IMenu";
import { IProductVariant } from "@/models/IProductVariant";
import { getAvailableStock } from "@/utils/stock";

export const useProductCard = (
    product: IMenuProduct,
    quantity: number,
    onAdd: (product: IMenuProduct, variant?: IProductVariant) => void,
) => {
    const { isOpen, openModal, closeModal } = useModal();
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;

    // Cuánto más se puede agregar de este producto: existencia total menos lo que ya está en
    // el carrito (sumando todas sus variantes). Sin manage_stock, getAvailableStock devuelve
    // Infinity y no hay tope — mismo patrón que QuickSale/useProductCard.
    const availableStock = getAvailableStock(product);
    const isManagedStock = availableStock !== Infinity;
    const maxAddable = Math.max(0, availableStock - quantity);
    const stockExhausted = isManagedStock && maxAddable <= 0;

    const handleAddClick = () => {
        if (stockExhausted) return;
        if (hasVariants) {
            openModal();
            return;
        }
        onAdd(product);
    };

    const handleSelectVariant = (variant: IProductVariant) => {
        closeModal();
        onAdd(product, variant);
    };

    return {
        hasVariants,
        isPickerOpen: isOpen,
        closePicker: closeModal,
        handleAddClick,
        handleSelectVariant,
        isManagedStock,
        availableStock,
        maxAddable,
        stockExhausted,
    };
};

import { useModal } from "@/hooks/useModal";
import { IMenuProduct } from "@/models/IMenu";
import { IProductVariant } from "@/models/IProductVariant";
import { VariantOption } from "@/components/orders/VariantPickerModal/VariantPickerModal";
import { getAvailableStockFor } from "@/utils/stock";

export const useProductCard = (
    product: IMenuProduct,
    quantity: number,
    quantityOf: (productId: number, variantId?: number | null) => number,
    onAdd: (product: IMenuProduct, variant?: IProductVariant) => void,
) => {
    const { isOpen, openModal, closeModal } = useModal();
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;

    // Sin variantes: cuánto más se puede agregar es existencia menos lo ya reservado en el
    // carrito. Con variantes, cada una lleva su propio stock — la card solo se agota cuando
    // TODAS sus variantes activas lo están; la disponibilidad de cada una se evalúa dentro de
    // VariantPickerModal.
    const availableStock = getAvailableStockFor(product, null);
    const isManagedStock = product.manage_stock;
    const maxAddable = Math.max(0, availableStock - quantity);
    const stockExhausted = hasVariants
        ? activeVariants.every((variant) => {
              const available = getAvailableStockFor(product, variant.id);
              const inCart = quantityOf(product.id, variant.id);
              return available !== Infinity && available - inCart <= 0;
          })
        : isManagedStock && maxAddable <= 0;

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

    const variantOptions: VariantOption[] = activeVariants.map((variant) => {
        const available = getAvailableStockFor(product, variant.id);
        const inCart = quantityOf(product.id, variant.id);
        const remaining = available === Infinity ? Infinity : available - inCart;
        return { variant, remaining, exhausted: remaining <= 0 };
    });

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
        variantOptions,
    };
};

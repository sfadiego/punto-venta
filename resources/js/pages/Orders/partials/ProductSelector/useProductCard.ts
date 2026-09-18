import { useModal } from "@/hooks/useModal";
import { ICartItem } from "@/models/ICartItem";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { VariantOption } from "@/components/orders/VariantPickerModal/VariantPickerModal";
import { getCartQuantityFor } from "@/utils/cartCalc";
import { getAvailableStockFor } from "@/utils/stock";

type OnAdd = (
    productId: number,
    name: string,
    price: number,
    variantId?: number | null,
    variantName?: string | null,
) => void | Promise<void>;

export const useProductCard = (
    product: IProduct,
    cart: ICartItem[],
    onAdd: OnAdd,
    onUpdateQuantity: (orderProductId: number, delta: number) => void,
) => {
    const { isOpen, openModal, closeModal } = useModal();
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;
    const isManagedStock = product.manage_stock;

    // Sin variantes: cuánto más se puede agregar es existencia menos lo ya reservado en el
    // carrito para ese producto (sin variante). Con variantes, cada una lleva su propio stock
    // — la tarjeta solo se agota cuando TODAS sus variantes activas lo están; la disponibilidad
    // de cada variante se evalúa dentro de VariantPickerModal.
    const stockExhausted = hasVariants
        ? activeVariants.every((variant) => {
              const available = getAvailableStockFor(product, variant.id);
              const inCart = getCartQuantityFor(cart, product.id, variant.id);
              return available !== Infinity && available - inCart <= 0;
          })
        : (() => {
              const available = getAvailableStockFor(product, null);
              const inCart = getCartQuantityFor(cart, product.id, null);
              return available !== Infinity && available - inCart <= 0;
          })();

    const handleClick = () => {
        if (stockExhausted) return;
        if (hasVariants) {
            openModal();
            return;
        }
        onAdd(product.id, product.nombre, product.precio);
    };

    const handleAddVariant = (variant: IProductVariant) =>
        onAdd(product.id, product.nombre, variant.precio, variant.id, variant.nombre);

    const handleRemoveVariant = (variant: IProductVariant) => {
        const item = cart.find(
            (i) => i.id === product.id && i.variantId === variant.id,
        );
        if (item) onUpdateQuantity(item.orderProductId, -1);
    };

    const variantOptions: VariantOption[] = activeVariants.map((variant) => {
        const available = getAvailableStockFor(product, variant.id);
        const inCart = getCartQuantityFor(cart, product.id, variant.id);
        const remaining = available === Infinity ? Infinity : available - inCart;
        return { variant, remaining, exhausted: remaining <= 0, quantity: inCart };
    });

    return {
        isPickerOpen: isOpen,
        closePicker: closeModal,
        handleClick,
        handleAddVariant,
        handleRemoveVariant,
        isManagedStock,
        stockExhausted,
        variantOptions,
    };
};

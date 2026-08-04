import { useModal } from "@/hooks/useModal";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";

type OnAdd = (
    productId: number,
    name: string,
    price: number,
    variantId?: number | null,
    variantName?: string | null,
) => void | Promise<void>;

export const useProductCard = (product: IProduct, onAdd: OnAdd) => {
    const { isOpen, openModal, closeModal } = useModal();
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;

    const handleClick = () => {
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
    };
};

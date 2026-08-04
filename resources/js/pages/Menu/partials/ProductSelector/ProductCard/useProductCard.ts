import { useModal } from "@/hooks/useModal";
import { IMenuProduct } from "@/models/IMenu";
import { IProductVariant } from "@/models/IProductVariant";

export const useProductCard = (
    product: IMenuProduct,
    onAdd: (product: IMenuProduct, variant?: IProductVariant) => void,
) => {
    const { isOpen, openModal, closeModal } = useModal();
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;

    const handleAddClick = () => {
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
    };
};

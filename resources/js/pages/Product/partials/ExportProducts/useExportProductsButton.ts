import { useAxios } from "@/hooks/useAxios";
import { useModal } from "@/hooks/useModal";

export const useExportProductsButton = () => {
    const { features } = useAxios();
    const { isOpen, openModal, closeModal } = useModal();

    // El backend solo expone la exportación a negocios retail (middleware `retail`).
    const isAvailable = features?.is_retail === true;

    return { isAvailable, isOpen, openModal, closeModal };
};

import { Tags } from "lucide-react";
import { AddonsManagerModal } from "./AddonsManagerModal";
import { useAddonsButton } from "./useAddonsButton";

/** Botón de la cabecera de Productos que abre el catálogo de toppings. */
export const AddonsButton = () => {
    const { canManageAddons, isOpen, openModal, closeModal } = useAddonsButton();

    if (!canManageAddons) return null;

    return (
        <>
            <button
                onClick={openModal}
                className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
            >
                <Tags size={15} />
                <span className="hidden sm:inline">Toppings</span>
            </button>
            <AddonsManagerModal isOpen={isOpen} onClose={closeModal} />
        </>
    );
};

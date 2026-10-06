import { useModal } from "@/hooks/useModal";
import { IAddonSelection } from "@/models/IAddon";
import { ICartItem } from "@/models/ICartItem";

export const useCartItemAddons = (
    item: ICartItem,
    onEdit: (orderProductId: number, addons: IAddonSelection[]) => Promise<void>,
) => {
    const modal = useModal();

    const availableIds = new Set(item.availableAddons.map((addon) => addon.id));
    const isStillAvailable = (addonId: number | null): addonId is number => addonId !== null && availableIds.has(addonId);

    // Se abre con los toppings actuales que todavía se pueden elegir; el backend rechaza los
    // desactivados o eliminados, así que se avisa que se quitarán al guardar.
    const initialSelection: IAddonSelection[] = item.addons
        .filter((addon) => isStillAvailable(addon.addonId))
        .map((addon) => ({ addon_id: addon.addonId as number, quantity: addon.quantity }));
    const removedNames = item.addons.filter((addon) => !isStillAvailable(addon.addonId)).map((addon) => addon.name);
    const notice = removedNames.length > 0 ? `Ya no están disponibles y se quitarán: ${removedNames.join(", ")}.` : null;

    // Solo líneas de catálogo cuyo producto ofrece toppings (o que ya llevan alguno, para poder quitarlo).
    const canEdit = !item.isExtra && item.id !== null && (item.availableAddons.length > 0 || item.addons.length > 0);
    // Una línea que la cocina ya marcó como lista no se edita: ya se preparó con los toppings que tenía.
    const isLocked = item.isReady;

    const handleConfirm = async (selection: IAddonSelection[]) => {
        modal.closeModal();
        await onEdit(item.orderProductId, selection);
    };

    return {
        isOpen: modal.isOpen,
        openModal: modal.openModal,
        closeModal: modal.closeModal,
        canEdit,
        isLocked,
        initialSelection,
        notice,
        handleConfirm,
        title: item.variantName ? `${item.name} (${item.variantName})` : item.name,
    };
};

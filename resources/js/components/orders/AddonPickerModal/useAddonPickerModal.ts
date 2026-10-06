import { useEffect, useMemo, useRef, useState } from "react";
import { IAddon, IAddonSelection } from "@/models/IAddon";

// Tope por topping en una línea (mismo límite que valida el backend).
export const MAX_ADDON_QUANTITY = 99;

export const useAddonPickerModal = (
    isOpen: boolean,
    addons: IAddon[],
    basePrice: number,
    initialSelection: IAddonSelection[],
    onConfirm: (selection: IAddonSelection[]) => void,
) => {
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    // La selección inicial se lee solo al abrir; el ref evita reiniciar lo capturado si el
    // padre vuelve a crear el arreglo en un re-render.
    const initialRef = useRef(initialSelection);
    useEffect(() => {
        initialRef.current = initialSelection;
    });

    // Cada apertura empieza limpia (o con los toppings actuales al editar): lo elegido para un
    // producto no se arrastra al siguiente.
    useEffect(() => {
        setQuantities(
            isOpen ? Object.fromEntries(initialRef.current.map((row) => [row.addon_id, row.quantity])) : {},
        );
    }, [isOpen]);

    const setQuantity = (addonId: number, quantity: number) =>
        setQuantities((current) => ({ ...current, [addonId]: Math.min(MAX_ADDON_QUANTITY, Math.max(0, quantity)) }));

    const add = (addonId: number) => setQuantity(addonId, (quantities[addonId] ?? 0) + 1);
    const remove = (addonId: number) => setQuantity(addonId, (quantities[addonId] ?? 0) - 1);

    const selection = useMemo<IAddonSelection[]>(
        () =>
            addons
                .filter((addon) => (quantities[addon.id] ?? 0) > 0)
                .map((addon) => ({ addon_id: addon.id, quantity: quantities[addon.id] })),
        [addons, quantities],
    );

    const selectedCount = selection.reduce((sum, row) => sum + row.quantity, 0);
    const unitTotal = basePrice + addons.reduce((sum, addon) => sum + addon.price * (quantities[addon.id] ?? 0), 0);

    return {
        quantities,
        add,
        remove,
        selectedCount,
        unitTotal,
        confirmWithAddons: () => onConfirm(selection),
        confirmWithoutAddons: () => onConfirm([]),
    };
};

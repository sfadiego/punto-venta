import { useState } from "react";

export type InventoryActionsTab = "reajuste" | "devolucion" | "importar";

const TAB_TITLES: Record<InventoryActionsTab, string> = {
    reajuste: "Reajuste de stock",
    devolucion: "Devolución de producto",
    importar: "Importar productos",
};

// Un solo modal para las tres acciones de escritura del Kardex (reajuste, devolución,
// importación) — antes eran tres botones/modales independientes en el header de Inventario;
// ahora comparten un único punto de entrada con pestañas, así una acción nueva no implica un
// botón más (ver INVENTORY_ACTIONS_REDESIGN, propuesta validada por el usuario).
export const useInventoryActionsModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<InventoryActionsTab>("reajuste");

    const openModal = (tab: InventoryActionsTab = "reajuste") => {
        setActiveTab(tab);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setActiveTab("reajuste");
    };

    return {
        isOpen,
        activeTab,
        setActiveTab,
        title: TAB_TITLES[activeTab],
        openModal,
        closeModal,
    };
};

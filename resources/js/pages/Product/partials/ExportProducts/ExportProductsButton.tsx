import { Download } from "lucide-react";
import { ExportCatalogModal } from "./ExportCatalogModal";
import { useExportProductsButton } from "./useExportProductsButton";

/** Botón de la cabecera de Productos que abre el modal para descargar el catálogo en CSV o PDF (solo retail). */
export const ExportProductsButton = () => {
    const { isAvailable, isOpen, openModal, closeModal } = useExportProductsButton();

    if (!isAvailable) return null;

    return (
        <>
            <button
                onClick={openModal}
                title="Descargar catálogo"
                className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
            >
                <Download size={15} />
                <span className="hidden sm:inline">Descargar catálogo</span>
            </button>
            {/* Se monta solo abierto: así el formulario arranca limpio cada vez. */}
            {isOpen && <ExportCatalogModal onClose={closeModal} />}
        </>
    );
};

import { X, Upload } from "lucide-react";
import { ImportProductsPanel } from "./ImportProductsPanel";
import { useImportProductsPanel } from "./useImportProductsPanel";

interface ProductImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Wrapper standalone para ProductsPage (cafetería/venta por peso) — en Inventario el mismo
// ImportProductsPanel/useImportProductsPanel vive embebido como pestaña dentro de
// InventoryActionsModal (exclusivo de retail); aquí se abre como su propio modal.
export const ProductImportModal = ({ isOpen, onClose }: ProductImportModalProps) => {
    const panel = useImportProductsPanel();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Upload size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Importar productos</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    <ImportProductsPanel {...panel} />
                </div>
            </div>
        </div>
    );
};

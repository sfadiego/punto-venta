import { X, PackagePlus, Undo2, Upload, LucideIcon } from "lucide-react";
import { InventoryActionsTab } from "./useInventoryActionsModal";
import { StockAdjustmentPanel } from "./StockAdjustment/StockAdjustmentPanel";
import { useStockAdjustmentPanel } from "./StockAdjustment/useStockAdjustmentPanel";
import { StockReturnPanel } from "./StockReturn/StockReturnPanel";
import { useStockReturnPanel } from "./StockReturn/useStockReturnPanel";
import { ImportProductsPanel } from "./ProductImport/ImportProductsPanel";
import { useImportProductsPanel } from "./ProductImport/useImportProductsPanel";

interface InventoryActionsModalProps {
    isOpen: boolean;
    activeTab: InventoryActionsTab;
    setActiveTab: (tab: InventoryActionsTab) => void;
    title: string;
    onClose: () => void;
}

const TABS: { key: InventoryActionsTab; label: string; icon: LucideIcon }[] = [
    { key: "reajuste", label: "Reajuste", icon: PackagePlus },
    { key: "devolucion", label: "Devolución", icon: Undo2 },
    { key: "importar", label: "Importar", icon: Upload },
];

export const InventoryActionsModal = ({ isOpen, activeTab, setActiveTab, title, onClose }: InventoryActionsModalProps) => {
    const adjustmentPanel = useStockAdjustmentPanel();
    const returnPanel = useStockReturnPanel();
    const importPanel = useImportProductsPanel(onClose);

    if (!isOpen) return null;

    const handleClose = () => {
        adjustmentPanel.reset();
        returnPanel.reset();
        importPanel.reset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">{title}</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex gap-1 px-3 pt-3" role="tablist">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-t-lg border border-b-0 transition-colors ${
                                activeTab === key
                                    ? "bg-white text-amber-600 border-stone-200"
                                    : "bg-stone-50 text-stone-500 border-transparent hover:text-stone-700"
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-5 border-t border-stone-200 max-h-[70vh] overflow-y-auto">
                    {activeTab === "reajuste" && <StockAdjustmentPanel {...adjustmentPanel} />}
                    {activeTab === "devolucion" && <StockReturnPanel {...returnPanel} />}
                    {activeTab === "importar" && <ImportProductsPanel {...importPanel} />}
                </div>
            </div>
        </div>
    );
};

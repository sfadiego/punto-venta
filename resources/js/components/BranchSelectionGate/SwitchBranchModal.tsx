import { createPortal } from "react-dom";
import { Store, X, Loader } from "lucide-react";
import { useAxios } from "@/hooks/useAxios";
import { useBranchList } from "@/services/useBranchService";
import { BranchOptionButton } from "./BranchOptionButton";

interface SwitchBranchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Selector manual de sucursal activa, disparado desde el sidebar. A diferencia de
 * BranchSelectionGate (pantalla bloqueante post-login sin salida), este modal es
 * cancelable — el usuario ya tiene una sucursal seleccionada y solo quiere cambiarla
 * (ej. el Admin le otorgó acceso a una sucursal nueva en medio de la sesión y el gate
 * inicial no vuelve a dispararse porque branchId ya era válido).
 */
export const SwitchBranchModal = ({ isOpen, onClose }: SwitchBranchModalProps) => {
    const { branchId, setBranch } = useAxios();
    const { data: branches, isLoading } = useBranchList(isOpen);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <Store size={18} className="text-amber-600" />
                        </div>
                        <h2 className="text-base font-bold text-stone-900">Cambiar sucursal</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader size={20} className="animate-spin text-stone-400" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {branches?.map((branch) => (
                            <BranchOptionButton
                                key={branch.id}
                                name={branch.name}
                                address={branch.address}
                                selected={branch.id === branchId}
                                onClick={() => {
                                    setBranch(branch.id);
                                    onClose();
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};

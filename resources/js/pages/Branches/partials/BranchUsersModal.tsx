import { X, Users, Loader } from "lucide-react";
import { useBranchUsersModal } from "./useBranchUsersModal";

interface BranchUsersModalProps {
    isOpen: boolean;
    branchId: number | null;
    branchName: string;
    onClose: () => void;
}

export const BranchUsersModal = ({ isOpen, branchId, branchName, onClose }: BranchUsersModalProps) => {
    const { assignableUsers, selectedIds, toggleUser, handleSave, isPending, isLoading } =
        useBranchUsersModal(branchId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <Users size={16} className="text-amber-600" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-stone-900 text-sm">Usuarios de la sucursal</h2>
                            <p className="text-xs text-stone-400 truncate">{branchName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader size={20} className="animate-spin text-stone-400" />
                        </div>
                    ) : assignableUsers.length === 0 ? (
                        <p className="text-sm text-stone-400 text-center py-6">
                            No hay usuarios (Empleado, Caja, Cocina) dados de alta todavía.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {assignableUsers.map((user) => (
                                <label
                                    key={user.id}
                                    className="flex items-center gap-2.5 text-sm text-stone-600 cursor-pointer border border-stone-100 rounded-xl px-3 py-2.5"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                        className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-medium text-stone-800 truncate">
                                            {user.nombre} {user.apellido_paterno}
                                        </p>
                                        <p className="text-xs text-stone-400 truncate">{user.email}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 pt-3 border-t border-stone-100 flex gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSave(onClose)}
                        disabled={isPending || isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {isPending && <Loader size={14} className="animate-spin" />}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

import { createPortal } from "react-dom";
import { X, Loader, Users } from "lucide-react";
import { Select } from "@/components/ui/form/Select";
import { IBranch } from "@/models/IBranch";

interface SeedBranchPickerModalProps {
    isOpen: boolean;
    branches: IBranch[];
    value: string;
    onChange: (value: string) => void;
    onConfirm: () => void;
    onClose: () => void;
    isPending: boolean;
}

/**
 * El tenant tiene 2+ sucursales: no hay forma correcta de adivinar a cuál asignar los
 * usuarios de acceso (Empleado/Caja/Cocina) que crea el seed — se le pide al SuperAdmin
 * elegir una explícitamente antes de confirmar (ver TenantUserSeedRequest en backend).
 */
export const SeedBranchPickerModal = ({
    isOpen, branches, value, onChange, onConfirm, onClose, isPending,
}: SeedBranchPickerModalProps) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Users size={16} className="text-indigo-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900 text-sm">Elegir sucursal</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-500">
                        Este tenant tiene varias sucursales. Los usuarios de acceso (Empleado, Caja, Cocina)
                        quedarán asignados a la sucursal que elijas.
                    </p>

                    <Select<{ branch_id: string }>
                        name="branch_id"
                        label="Sucursal"
                        placeholder="Selecciona una sucursal"
                        options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                        value={value}
                        onChange={onChange}
                    />

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isPending || !value}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {isPending && <Loader size={14} className="animate-spin" />}
                            {isPending ? "Creando..." : "Crear usuarios"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

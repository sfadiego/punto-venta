import { X, Package } from "lucide-react";

interface ProductModalHeaderProps {
    isEdit: boolean;
    nombre: string;
    onClose: () => void;
}

export const ProductModalHeader = ({ isEdit, nombre, onClose }: ProductModalHeaderProps) => (
    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Package size={16} className="text-amber-600" />
            </div>
            <div>
                <h2 className="font-semibold text-stone-900 text-sm">
                    {isEdit ? "Editar producto" : "Nuevo producto"}
                </h2>
                {isEdit && (
                    <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[220px]">
                        {nombre}
                    </p>
                )}
            </div>
        </div>
        <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
        >
            <X size={16} />
        </button>
    </div>
);

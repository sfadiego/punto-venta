import { Loader, Package } from "lucide-react";

interface ProductModalFooterProps {
    isEdit: boolean;
    isSubmitting: boolean;
    onClose: () => void;
}

export const ProductModalFooter = ({ isEdit, isSubmitting, onClose }: ProductModalFooterProps) => (
    <div className="flex gap-2 pt-1">
        <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
        >
            Cancelar
        </button>
        <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
            {isSubmitting ? (
                <>
                    <Loader size={14} className="animate-spin" />
                    Guardando...
                </>
            ) : (
                <>
                    <Package size={14} />
                    {isEdit ? "Guardar cambios" : "Crear producto"}
                </>
            )}
        </button>
    </div>
);

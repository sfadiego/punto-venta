import { X, ClipboardList, Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { FormikProps } from "formik";

type NewOrderForm = {
    nombre_pedido: string;
};

interface NewOrderModalProps {
    isOpen: boolean;
    isPending: boolean;
    formik: FormikProps<NewOrderForm>;
    onClose: () => void;
}

export const NewOrderModal = ({ isOpen, isPending, formik, onClose }: NewOrderModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <ClipboardList size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Nueva orden</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
                    <Input<NewOrderForm>
                        name="nombre_pedido"
                        label="Nombre de la mesa"
                        placeholder="Ej: Mesa 4, Terraza, Barra..."
                        maxLength={255}
                        formik={formik}
                    />

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
                            disabled={isPending}
                            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            {isPending ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                "Crear orden"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

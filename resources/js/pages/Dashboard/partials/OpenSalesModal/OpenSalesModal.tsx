import { X, Landmark, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";

type OpenSalesForm = {
    efectivo_caja_inicio: string;
    observaciones: string;
};

interface OpenSalesModalProps {
    isOpen: boolean;
    isPending: boolean;
    formik: FormikProps<OpenSalesForm>;
    onClose: () => void;
}

export const OpenSalesModal = ({ isOpen, isPending, formik, onClose }: OpenSalesModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Landmark size={16} className="text-emerald-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Abrir caja</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
                    <Input<OpenSalesForm>
                        name="efectivo_caja_inicio"
                        label="Efectivo inicial en caja"
                        placeholder="0.00"
                        formik={formik}
                    />
                    <Input<OpenSalesForm>
                        name="observaciones"
                        label="Observaciones (opcional)"
                        placeholder="Notas de apertura..."
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
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Abriendo...
                                </>
                            ) : (
                                "Abrir caja"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

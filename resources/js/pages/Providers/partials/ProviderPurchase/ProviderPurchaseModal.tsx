import { FormikProps } from "formik";
import { X, ShoppingBag, Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { ProviderPurchaseForm as ProviderPurchaseFormValues } from "../../useProviderDetailPage";

interface ProviderPurchaseModalProps {
    isOpen: boolean;
    formik: FormikProps<ProviderPurchaseFormValues>;
    isSubmitting: boolean;
    onClose: () => void;
}

export const ProviderPurchaseModal = ({ isOpen, formik, isSubmitting, onClose }: ProviderPurchaseModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <ShoppingBag size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Registrar compra</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5">
                    <div className="space-y-4">
                        <Input
                            name="amount"
                            label="Monto"
                            inputType="text"
                            maxLength={12}
                            formik={formik}
                            placeholder="0.00"
                        />
                        <Input
                            name="note"
                            label="Nota (opcional)"
                            inputType="text"
                            maxLength={500}
                            formik={formik}
                            placeholder="Ej: carne de res y pollo, 20kg"
                        />
                    </div>

                    <div className="flex gap-2 pt-5">
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
                                    <ShoppingBag size={14} />
                                    Registrar compra
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

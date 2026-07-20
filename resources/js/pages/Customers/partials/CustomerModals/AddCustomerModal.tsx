import { X, UserPlus, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { CustomerForm } from "./useAddCustomerModal";
import { CustomerFormFields } from "../CustomerFormFields";

interface AddCustomerModalProps {
    isOpen: boolean;
    formik: FormikProps<CustomerForm>;
    onClose: () => void;
}

export const AddCustomerModal = ({ isOpen, formik, onClose }: AddCustomerModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <UserPlus size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Nuevo cliente</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5">
                    <CustomerFormFields formik={formik} />

                    <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formik.values.allow_credit}
                            onChange={(e) => formik.setFieldValue("allow_credit", e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-stone-700">Permite crédito</span>
                    </label>

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
                            disabled={formik.isSubmitting}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {formik.isSubmitting ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={14} />
                                    Crear cliente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

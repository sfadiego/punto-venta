import { X, CalendarOff, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { AbsenceForm } from "./absenceForm";

interface AbsenceModalProps {
    isOpen: boolean;
    formik: FormikProps<AbsenceForm>;
    onClose: () => void;
}

export const AbsenceModal = ({ isOpen, formik, onClose }: AbsenceModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <CalendarOff size={16} className="text-red-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Registrar falta</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
                    <Input name="date" label="Fecha" inputType="date" formik={formik} />

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">¿Avisó con anticipación?</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => formik.setFieldValue("notified", true)}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                    formik.values.notified
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-white border-stone-200 text-stone-500 hover:border-emerald-300"
                                }`}
                            >
                                Sí, avisó
                            </button>
                            <button
                                type="button"
                                onClick={() => formik.setFieldValue("notified", false)}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                    !formik.values.notified
                                        ? "bg-red-500 border-red-500 text-white"
                                        : "bg-white border-stone-200 text-stone-500 hover:border-red-300"
                                }`}
                            >
                                No avisó
                            </button>
                        </div>
                    </div>

                    {!formik.values.notified && (
                        <Input
                            name="deduction_amount"
                            label="Monto a descontar"
                            inputType="number"
                            min={0}
                            step={0.01}
                            formik={formik}
                        />
                    )}

                    <Input name="notes" label="Notas (opcional)" placeholder="Ej: no contestó llamadas" formik={formik} />

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
                            disabled={formik.isSubmitting}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {formik.isSubmitting ? <Loader size={14} className="animate-spin" /> : "Registrar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

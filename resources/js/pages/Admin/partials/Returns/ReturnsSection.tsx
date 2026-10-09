import { Loader } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { Input } from "@/components/ui/form/Input";
import { ReturnsFormValues, useReturnsSection } from "./useReturnsSection";

interface ReturnsSectionProps {
    config: IBusinessConfig | undefined;
}

export const ReturnsSection = ({ config }: ReturnsSectionProps) => {
    const { formik } = useReturnsSection(config);

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Devoluciones</h2>
                <p className="text-xs text-stone-400">Reglas para devolver productos vendidos</p>
            </div>

            <div>
                <Input<ReturnsFormValues>
                    name="return_days"
                    label="Plazo para devolver (días)"
                    inputType="number"
                    inputMode="numeric"
                    min={0}
                    max={365}
                    step={1}
                    formik={formik}
                />
                <p className="text-xs text-stone-400 mt-1.5">
                    Días desde la venta durante los que se acepta una devolución (por defecto 10). Pasado el plazo el botón
                    «Devolver productos» se deshabilita para todos los roles. 0 = sin límite.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={formik.isSubmitting || !formik.dirty}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                    {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                    Guardar configuración
                </button>
            </div>
        </form>
    );
};

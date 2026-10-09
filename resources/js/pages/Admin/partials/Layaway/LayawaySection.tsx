import { Loader } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { Input } from "@/components/ui/form/Input";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { LAYAWAY_EXAMPLE_TOTAL, LayawayFormValues, useLayawaySection } from "./useLayawaySection";

interface LayawaySectionProps {
    config: IBusinessConfig | undefined;
}

export const LayawaySection = ({ config }: LayawaySectionProps) => {
    const { formik, exampleDeposit } = useLayawaySection(config);

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Apartados</h2>
                <p className="text-xs text-stone-400">Reglas para las ventas apartadas de tu tienda</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <Input<LayawayFormValues>
                        name="layaway_min_percent"
                        label="Anticipo mínimo (%)"
                        inputType="number"
                        inputMode="decimal"
                        min={1}
                        max={100}
                        step={0.5}
                        formik={formik}
                    />
                    <p className="text-xs text-stone-400 mt-1.5">
                        En una venta de {formatCurrencyTrimmed(LAYAWAY_EXAMPLE_TOTAL)} el anticipo mínimo será{" "}
                        <span className="font-semibold text-stone-600">{formatCurrencyTrimmed(exampleDeposit)}</span>
                    </p>
                </div>

                <div>
                    <Input<LayawayFormValues>
                        name="layaway_days"
                        label="Plazo para liquidar (días)"
                        inputType="number"
                        inputMode="numeric"
                        min={1}
                        max={365}
                        step={1}
                        formik={formik}
                    />
                    <p className="text-xs text-stone-400 mt-1.5">
                        La fecha límite se calcula desde el día del apartado
                    </p>
                </div>

                <div className="sm:col-span-2">
                    <Input<LayawayFormValues>
                        name="layaway_retention_percent"
                        label="Retención sugerida al cancelar (%)"
                        inputType="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={0.5}
                        formik={formik}
                    />
                    <p className="text-xs text-stone-400 mt-1.5">
                        Porcentaje de lo abonado que se sugiere retener al cancelar un apartado. 0% reembolsa todo; quien cancela
                        puede ajustarlo en cada cancelación.
                    </p>
                </div>
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

import { Bike, DollarSign, Loader } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useDeliverySection } from "./useDeliverySection";

interface DeliverySectionProps {
    config: IBusinessConfig | undefined;
}

export const DeliverySection = ({ config }: DeliverySectionProps) => {
    const { formik } = useDeliverySection(config);

    return (
        <form onSubmit={formik.handleSubmit} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Configuración de domicilio</h2>
                <p className="text-xs text-stone-400">Costo por defecto del servicio a domicilio</p>
            </div>

            <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1.5">
                    <span className="text-amber-500"><DollarSign size={15} /></span>
                    Costo domicilio por defecto
                </label>
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input
                        type="number"
                        name="costo_domicilio_default"
                        value={formik.values.costo_domicilio_default}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-8 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    />
                </div>
                {formik.touched.costo_domicilio_default && formik.errors.costo_domicilio_default && (
                    <p className="text-red-500 text-xs mt-1">{String(formik.errors.costo_domicilio_default)}</p>
                )}
                <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1">
                    <Bike size={12} />
                    Este valor se precargará al registrar una nueva venta a domicilio
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

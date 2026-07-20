import { RotateCcw } from "lucide-react";
import { ColorField } from "./ColorField";
import { TenantFormik } from "@/pages/SuperAdmin/Tenants/useTenantForm";

interface TenantColorsSectionProps {
    formik: TenantFormik;
    onResetColors: () => void;
}

export const TenantColorsSection = ({ formik, onResetColors }: TenantColorsSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Colores del tema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorField name="primary_color" label="Color primario" formik={formik} />
            <ColorField name="sidebar_color" label="Color sidebar" formik={formik} />
            <ColorField name="font_color" label="Color fuente" formik={formik} />
            <ColorField name="label_color" label="Color etiqueta" formik={formik} />
        </div>
        <button
            type="button"
            onClick={onResetColors}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
            <RotateCcw size={12} />
            Restablecer colores por defecto
        </button>
    </section>
);

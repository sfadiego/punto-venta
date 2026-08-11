import { FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { SelectBusinessType } from "./SelectBusinessType";
import { SectionSaveButton } from "./SectionSaveButton";
import { TenantFormik } from "@/pages/SuperAdmin/Tenants/useTenantForm";

interface TenantBusinessSectionProps {
    formik: TenantFormik;
}

export const TenantBusinessSection = ({ formik }: TenantBusinessSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Datos del negocio
        </h2>
        <Input name="business_name" label="Nombre del negocio" placeholder="Ej: Café Luna" maxLength={100} formik={formik} />
        <Input name="slug" label="Slug (URL de acceso)" placeholder="ej: cafe-luna" maxLength={255} formik={formik} />
        <p className="text-xs text-slate-400">
            El cliente accederá desde: <span className="font-mono">/{formik.values.slug || "slug"}/auth</span>
        </p>
        <SelectBusinessType name="tipo_negocio" formik={formik} />

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <FlaskConical size={17} className="text-slate-500" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Cliente demo</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Márcalo para diferenciarlo de los clientes reales en los filtros del listado.
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => formik.setFieldValue("is_demo", !formik.values.is_demo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    formik.values.is_demo ? "bg-indigo-600" : "bg-slate-200"
                }`}
                role="switch"
                aria-checked={formik.values.is_demo}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        formik.values.is_demo ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
        <SectionSaveButton onSave={formik.submitForm} isSaving={formik.isSubmitting} />
    </section>
);

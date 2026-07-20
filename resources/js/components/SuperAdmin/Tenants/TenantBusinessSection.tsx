import { Input } from "@/components/ui/form/Input";
import { SelectBusinessType } from "./SelectBusinessType";
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
            El cliente accederá desde: <span className="font-mono">/{formik.values.slug || "slug"}/login</span>
        </p>
        <SelectBusinessType name="tipo_negocio" formik={formik} />
    </section>
);

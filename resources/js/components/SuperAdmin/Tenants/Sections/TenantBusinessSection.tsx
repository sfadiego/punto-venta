import { FlaskConical, TestTube } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { SelectBusinessType } from "./SelectBusinessType";
import { SectionSaveButton } from "./SectionSaveButton";
import { TenantFlagToggle } from "./TenantFlagToggle";
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

        <TenantFlagToggle
            icon={<FlaskConical size={17} className="text-slate-500" />}
            title="Cliente demo"
            description="Prospecto en periodo de prueba. Vence con su suscripción y no tiene días de gracia."
            checked={formik.values.is_demo}
            onToggle={() => {
                formik.setFieldValue("is_demo", !formik.values.is_demo);
                formik.setFieldValue("is_test", false);
            }}
        />
        <TenantFlagToggle
            icon={<TestTube size={17} className="text-slate-500" />}
            title="Negocio de pruebas"
            description="Uso interno para testing. Nunca vence y no cuenta en ingresos ni en métricas de clientes."
            checked={formik.values.is_test}
            onToggle={() => {
                formik.setFieldValue("is_test", !formik.values.is_test);
                formik.setFieldValue("is_demo", false);
            }}
        />
        <SectionSaveButton onSave={formik.submitForm} isSaving={formik.isSubmitting} />
    </section>
);

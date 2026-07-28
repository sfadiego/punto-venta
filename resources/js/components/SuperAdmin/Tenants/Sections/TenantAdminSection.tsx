import { Input } from "@/components/ui/form/Input";
import { TenantFormik } from "@/pages/SuperAdmin/Tenants/useTenantForm";

interface TenantAdminSectionProps {
    formik: TenantFormik;
}

export const TenantAdminSection = ({ formik }: TenantAdminSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Usuario administrador
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="admin_nombre" label="Nombre" maxLength={100} formik={formik} />
            <Input name="admin_apellido" label="Apellido" maxLength={100} formik={formik} />
            <Input name="admin_email" label="Correo electrónico" inputType="email" formik={formik} />
            <Input name="admin_usuario" label="Nombre de usuario" maxLength={255} formik={formik} />
        </div>
        <Input name="admin_password" label="Contraseña" inputType="password" formik={formik} />
    </section>
);

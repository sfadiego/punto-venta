import { Input } from "@/components/ui/form/Input";
import { TenantFormik } from "@/pages/SuperAdmin/Tenants/useTenantForm";

interface ColorFieldProps {
    name: keyof TenantFormik["values"] & string;
    label: string;
    formik: TenantFormik;
}

export const ColorField = ({ name, label, formik }: ColorFieldProps) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                name={name}
                value={formik.values[name] as string}
                onChange={formik.handleChange}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0"
            />
            <Input name={name} formik={formik} className="font-mono" />
        </div>
    </div>
);

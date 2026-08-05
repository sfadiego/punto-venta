import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { sanitizePhoneInput } from "@/utils/phoneUtils";
import { ProviderForm } from "./useProviderModal";

interface ProviderFormFieldsProps {
    formik: FormikProps<ProviderForm>;
}

export const ProviderFormFields = ({ formik }: ProviderFormFieldsProps) => (
    <div className="space-y-4">
        <Input name="name" label="Nombre" placeholder="Ej: Distribuidora El Buen Precio" maxLength={255} formik={formik} />
        <Input
            name="phone"
            label="Teléfono"
            placeholder="Ej: 5512345678"
            maxLength={13}
            value={formik.values.phone}
            onChange={(e) => formik.setFieldValue("phone", sanitizePhoneInput(e.target.value))}
            onBlur={formik.handleBlur}
            error={formik.touched.phone ? formik.errors.phone : undefined}
        />
        <Input name="contact_name" label="Persona de contacto (opcional)" placeholder="Ej: Juan Pérez" maxLength={255} formik={formik} />
        <Textarea name="notes" label="Notas (opcional)" placeholder="Información adicional del proveedor" formik={formik} rows={2} maxLength={1000} />
    </div>
);

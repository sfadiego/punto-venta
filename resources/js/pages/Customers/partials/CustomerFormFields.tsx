import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { CustomerForm } from "./CustomerModals/useAddCustomerModal";

interface CustomerFormFieldsProps {
    formik: FormikProps<CustomerForm>;
}

export const CustomerFormFields = ({ formik }: CustomerFormFieldsProps) => (
    <div className="space-y-4">
        <Input name="name" label="Nombre" placeholder="Ej: Loncheria Doña Mary" maxLength={255} formik={formik} />
        <Input name="phone" label="Teléfono" placeholder="Ej: 5512345678" maxLength={20} formik={formik} />
        <Textarea name="notes" label="Notas (opcional)" placeholder="Referencia, dirección, etc." formik={formik} rows={3} />
    </div>
);

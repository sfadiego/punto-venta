import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { AddressAutocomplete } from "@/components/ui/form/AddressAutocomplete";
import { CustomerForm } from "./CustomerModals/useAddCustomerModal";

interface CustomerFormFieldsProps {
    formik: FormikProps<CustomerForm>;
}

export const CustomerFormFields = ({ formik }: CustomerFormFieldsProps) => (
    <div className="space-y-4">
        <Input name="name" label="Nombre" placeholder="Ej: Loncheria Doña Mary" maxLength={255} formik={formik} />
        <Input name="phone" label="Teléfono" placeholder="Ej: 5512345678" maxLength={20} formik={formik} />
        <AddressAutocomplete formik={formik} name="address" label="Dirección de entrega (opcional)" placeholder="Calle, número, colonia…" />
        <Input name="delivery_reference" label="Referencia (opcional)" placeholder="Ej. casa azul, portón negro, junto al parque…" maxLength={500} formik={formik} />
        <Textarea name="notes" label="Notas (opcional)" placeholder="Información adicional del cliente" formik={formik} rows={2} />
    </div>
);

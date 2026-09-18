import { ChevronDown } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { AddressAutocomplete } from "@/components/ui/form/AddressAutocomplete";
import { CustomerForm } from "./useAddCustomerModal";
import { useCustomerFormFields } from "./useCustomerFormFields";

interface CustomerFormFieldsProps {
    formik: FormikProps<CustomerForm>;
}

export const CustomerFormFields = ({ formik }: CustomerFormFieldsProps) => {
    const { isAddressOpen, toggleAddress } = useCustomerFormFields(formik);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Input name="name" label="Nombre" placeholder="Ej: Loncheria Doña Mary" maxLength={255} formik={formik} />
                <Input name="phone" label="Teléfono" placeholder="Ej: 5512345678" maxLength={20} formik={formik} />
            </div>

            {/* Domicilio del cliente — separado de sus datos de contacto y colapsado por
            default (es opcional, la mayoría de los clientes no lo necesitan). */}
            <div>
                <button
                    type="button"
                    onClick={toggleAddress}
                    aria-expanded={isAddressOpen}
                    className="w-full flex items-center justify-between text-xs font-semibold text-stone-400 uppercase tracking-wide py-1 hover:text-stone-600 transition-colors"
                >
                    Domicilio (opcional)
                    <ChevronDown size={14} className={`transition-transform ${isAddressOpen ? "rotate-180" : ""}`} />
                </button>

                {isAddressOpen && (
                    <div className="space-y-4 mt-3">
                        <AddressAutocomplete formik={formik} name="address" label="Dirección" placeholder="Calle, número, colonia…" />
                        <Input name="delivery_reference" label="Referencia" placeholder="Ej. casa azul, portón negro, junto al parque…" maxLength={500} formik={formik} />
                    </div>
                )}
            </div>

            <Textarea name="notes" label="Notas (opcional)" placeholder="Información adicional del cliente" formik={formik} rows={2} />
        </div>
    );
};

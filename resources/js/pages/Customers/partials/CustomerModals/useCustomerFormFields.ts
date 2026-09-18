import { useState } from "react";
import { FormikProps } from "formik";
import { CustomerForm } from "./useAddCustomerModal";

// La sección de domicilio arranca colapsada (es opcional, la mayoría de los clientes no la
// necesitan) — EXCEPTO si el formulario ya trae dirección/referencia cargada (editar un
// cliente que ya tiene domicilio no debe esconder esos datos al abrir el modal).
export const useCustomerFormFields = (formik: FormikProps<CustomerForm>) => {
    const [isAddressOpen, setIsAddressOpen] = useState(
        () => !!(formik.values.address || formik.values.delivery_reference),
    );

    const toggleAddress = () => setIsAddressOpen((prev) => !prev);

    return { isAddressOpen, toggleAddress };
};

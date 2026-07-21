import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ICustomer } from "@/models/ICustomer";
import { useUpdateCustomer } from "@/services/useCustomerService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { CustomerForm } from "./useAddCustomerModal";

const schema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    phone: Yup.string().max(20, "Máximo 20 caracteres"),
    notes: Yup.string().max(1000, "Máximo 1000 caracteres"),
    address: Yup.string().max(500, "Máximo 500 caracteres"),
    delivery_reference: Yup.string().max(500, "Máximo 500 caracteres"),
});

export const useEditCustomerModal = (
    customer: ICustomer | null,
    onSuccess: () => void,
    onClose: () => void,
) => {
    const { mutateAsync: updateCustomer } = useUpdateCustomer(customer?.id ?? 0);

    const formik = useFormik<CustomerForm>({
        enableReinitialize: true,
        initialValues: {
            name: customer?.name ?? "",
            phone: customer?.phone ?? "",
            notes: customer?.notes ?? "",
            address: customer?.address ?? "",
            delivery_reference: customer?.delivery_reference ?? "",
            allow_credit: customer?.allow_credit ?? true,
        },
        validationSchema: schema,
        onSubmit: async (values) => {
            try {
                await updateCustomer({
                    name: values.name.trim(),
                    phone: values.phone.trim() || null,
                    notes: values.notes.trim() || null,
                    address: values.address.trim() || null,
                    delivery_reference: values.delivery_reference.trim() || null,
                });
                toast.success("Cliente actualizado");
                onSuccess();
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useEditCustomerModal.onSubmit");
                toast.error("Error al actualizar el cliente");
            }
        },
    });

    return { formik };
};

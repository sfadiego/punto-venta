import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { useStoreCustomer } from "@/services/useCustomerService";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export type CustomerForm = {
    name: string;
    phone: string;
    notes: string;
    address: string;
    delivery_reference: string;
    allow_credit: boolean;
};

const schema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    phone: Yup.string().max(20, "Máximo 20 caracteres"),
    notes: Yup.string().max(1000, "Máximo 1000 caracteres"),
    address: Yup.string().max(500, "Máximo 500 caracteres"),
    delivery_reference: Yup.string().max(500, "Máximo 500 caracteres"),
    allow_credit: Yup.boolean(),
});

export const useAddCustomerModal = (onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const { mutateAsync: storeCustomer } = useStoreCustomer();

    const formik = useFormik<CustomerForm>({
        initialValues: { name: "", phone: "", notes: "", address: "", delivery_reference: "", allow_credit: true },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            try {
                await storeCustomer({
                    name: values.name.trim(),
                    ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
                    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
                    ...(values.address.trim() ? { address: values.address.trim() } : {}),
                    ...(values.delivery_reference.trim() ? { delivery_reference: values.delivery_reference.trim() } : {}),
                    allow_credit: values.allow_credit,
                });
                toast.success("Cliente creado exitosamente");
                helpers.resetForm();
                closeModal();
                onSuccess();
            } catch (error) {
                logUnexpectedError(error, "useAddCustomerModal.onSubmit");
                toast.error("Error al crear el cliente");
            }
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik };
};

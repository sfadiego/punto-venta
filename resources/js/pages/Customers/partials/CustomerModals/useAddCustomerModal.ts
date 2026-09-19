import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { useStoreCustomer } from "@/services/useCustomerService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { isValidPhone, phoneValidationMessage } from "@/utils/phoneUtils";

export type CustomerForm = {
    name: string;
    phone: string;
    notes: string;
    address: string;
    delivery_reference: string;
    allow_credit: boolean;
    // Opcionales: solo aplican al crear un cliente nuevo (CustomerInitialChargeFields) —
    // EditCustomerModal reutiliza este mismo tipo pero no los incluye, ya que editar un
    // adeudo existente se hace desde CustomerChargeModal, no desde este formulario.
    has_initial_charge?: boolean;
    initial_charge_amount?: string;
    initial_charge_note?: string;
};

const schema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    phone: Yup.string()
        .max(20, "Máximo 20 caracteres")
        .test("valid-phone", phoneValidationMessage, (value) => !value || isValidPhone(value)),
    notes: Yup.string().max(1000, "Máximo 1000 caracteres"),
    address: Yup.string().max(500, "Máximo 500 caracteres"),
    delivery_reference: Yup.string().max(500, "Máximo 500 caracteres"),
    allow_credit: Yup.boolean(),
    has_initial_charge: Yup.boolean(),
    // Adeudo inicial opcional — para dar de alta clientes que ya traían deuda antes de
    // integrar el sistema. El monto solo es obligatorio si se activó el toggle.
    initial_charge_amount: Yup.string().when("has_initial_charge", {
        is: true,
        then: (s) =>
            s.test("valid-amount", "Debe ser mayor a 0", (value) => Number(value) >= 0.01),
    }),
    initial_charge_note: Yup.string().max(500, "Máximo 500 caracteres"),
});

export const useAddCustomerModal = (onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const { mutateAsync: storeCustomer } = useStoreCustomer();

    const formik = useFormik<CustomerForm>({
        initialValues: {
            name: "",
            phone: "",
            notes: "",
            address: "",
            delivery_reference: "",
            allow_credit: true,
            has_initial_charge: false,
            initial_charge_amount: "",
            initial_charge_note: "",
        },
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
                    ...(values.has_initial_charge && values.initial_charge_amount
                        ? {
                              initial_charge_amount: Number(values.initial_charge_amount),
                              ...(values.initial_charge_note?.trim() ? { initial_charge_note: values.initial_charge_note.trim() } : {}),
                          }
                        : {}),
                });
                toast.success("Cliente creado exitosamente");
                helpers.resetForm();
                closeModal();
                onSuccess();
            } catch (error) {
                logUnexpectedError(error, "useAddCustomerModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al crear el cliente"));
            }
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik };
};

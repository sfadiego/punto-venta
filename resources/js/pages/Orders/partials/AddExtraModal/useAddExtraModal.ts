import { useFormik } from "formik";
import * as Yup from "yup";
import { useModal } from "@/hooks/useModal";

type ExtraForm = {
    nombre: string;
    precio: string;
    cantidad: number;
};

const schema = Yup.object({
    nombre: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    precio: Yup.number()
        .typeError("Ingresa un precio válido")
        .positive("El precio debe ser mayor a 0")
        .required("El precio es requerido"),
    cantidad: Yup.number().min(1, "Mínimo 1").max(99).required(),
});

export const useAddExtraModal = (onAdd: (nombre: string, precio: number, cantidad: number) => Promise<void>) => {
    const { isOpen, openModal, closeModal } = useModal();

    const formik = useFormik<ExtraForm>({
        initialValues: { nombre: "", precio: "", cantidad: 1 },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            await onAdd(values.nombre.trim(), Number(values.precio), values.cantidad);
            helpers.resetForm();
            closeModal();
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik };
};

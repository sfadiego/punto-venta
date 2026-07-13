import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { useStoreCategory } from "@/services/useCategoriesService";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export type CategoryForm = {
    nombre: string;
    orden: string;
    icon_name: string;
};

const schema = Yup.object({
    nombre: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    orden: Yup.number().typeError("Debe ser un número entero").integer("Debe ser un número entero").min(0, "Debe ser mayor a 0").max(2147483647, "Valor fuera de rango").nullable(),
    icon_name: Yup.string().max(100, "Máximo 100 caracteres"),
});

export const useAddCategoryModal = (onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const { mutateAsync: storeCategory } = useStoreCategory();

    const formik = useFormik<CategoryForm>({
        initialValues: { nombre: "", orden: "", icon_name: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            try {
                await storeCategory({
                    nombre: values.nombre.trim(),
                    ...(values.orden !== "" ? { orden: Number(values.orden) } : {}),
                    ...(values.icon_name.trim() ? { icon_name: values.icon_name.trim() } : {}),
                });
                toast.success("Categoría creada exitosamente");
                helpers.resetForm();
                closeModal();
                onSuccess();
            } catch (error) {

                logUnexpectedError(error, "useAddCategoryModal.onSubmit");
                toast.error("Error al crear la categoría");
            }
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik };
};

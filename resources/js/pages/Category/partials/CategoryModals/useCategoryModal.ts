import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ICategory } from "@/models/ICategory";
import { useStoreCategory, useUpdateCategory } from "@/services/useCategoriesService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";

export type CategoryForm = {
    nombre: string;
    orden: string;
    icon_name: string;
};

const schema = Yup.object({
    nombre: Yup.string().trim().required("El nombre es requerido")
        .max(70, "Máximo 70 caracteres"),
    orden: Yup.number().typeError("Debe ser un número entero")
        .integer("Debe ser un número entero")
        .min(0, "Debe ser mayor a 0")
        .max(2147483647, "Valor fuera de rango")
        .nullable(),
    icon_name: Yup.string()
        .max(70, "Máximo 70 caracteres"),
});

export const useCategoryModal = (category: ICategory | null, nextOrder: number, onSuccess: () => void, onClose: () => void) => {
    const isEdit = !!category;
    const { mutateAsync: storeCategory } = useStoreCategory();
    const { mutateAsync: updateCategory } = useUpdateCategory(category?.id ?? 0);

    const formik = useFormik<CategoryForm>({
        enableReinitialize: true,
        initialValues: {
            nombre: category?.nombre ?? "",
            orden: category ? category.orden?.toString() ?? "" : nextOrder.toString(),
            icon_name: category?.icon_name ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const payload = {
                nombre: values.nombre.trim(),
                ...(values.orden !== "" ? { orden: Number(values.orden) } : {}),
                icon_name: values.icon_name.trim(),
            };

            try {
                if (isEdit) {
                    await updateCategory(payload);
                    toast.success("Categoría actualizada");
                } else {
                    await storeCategory(payload);
                    toast.success("Categoría creada exitosamente");
                    helpers.resetForm();
                }
                onSuccess();
                onClose();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);

                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                } else {
                    logUnexpectedError(error, "useCategoryModal.onSubmit");
                    toast.error(getUserFacingErrorMessage(error, `Error al ${isEdit ? "actualizar" : "crear"} la categoría`));
                }
            }
        },
    });

    return { isEdit, formik };
};

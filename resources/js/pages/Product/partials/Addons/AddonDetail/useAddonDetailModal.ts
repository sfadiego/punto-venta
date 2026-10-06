import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { IAddon } from "@/models/IAddon";
import { invalidateAddonQueries, useStoreAddon, useUpdateAddon } from "@/services/useAddonService";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { capitalizeFirstLetter } from "@/utils/textCase";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export type AddonForm = {
    name: string;
    price: string;
    is_active: boolean;
};

const schema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    price: Yup.number()
        .typeError("Ingresa un precio válido")
        .min(0, "El precio no puede ser negativo")
        .max(99999, "El precio es demasiado grande")
        .required("El precio es requerido"),
    is_active: Yup.boolean(),
});

export const useAddonDetailModal = (addon: IAddon | null, onSaved: (addon: IAddon) => void, onClose: () => void) => {
    const isEdit = addon !== null;
    const queryClient = useQueryClient();
    const { mutateAsync: storeAddon } = useStoreAddon();
    const { mutateAsync: updateAddon } = useUpdateAddon();

    const formik = useFormik<AddonForm>({
        enableReinitialize: true,
        initialValues: {
            name: addon?.name ?? "",
            price: addon ? String(addon.price) : "0",
            is_active: addon?.is_active ?? true,
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const data = {
                name: capitalizeFirstLetter(values.name),
                price: Number(values.price),
                is_active: values.is_active,
            };

            try {
                const response = isEdit
                    ? await updateAddon({ addonId: addon.id, data })
                    : await storeAddon(data);
                const saved = (response.data as unknown as { data: IAddon }).data;

                invalidateAddonQueries(queryClient);
                toast.success(isEdit ? "Topping actualizado" : "Topping creado");
                helpers.resetForm();
                onSaved(saved);
                onClose();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);
                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                } else {
                    logUnexpectedError(error, "useAddonDetailModal.onSubmit");
                    toast.error(getUserFacingErrorMessage(error, `Error al ${isEdit ? "actualizar" : "crear"} el topping`));
                }
            }
        },
    });

    // Cerrar sin guardar descarta lo capturado, igual que el formulario de producto.
    const handleClose = () => {
        formik.resetForm();
        onClose();
    };

    return { isEdit, formik, handleClose };
};

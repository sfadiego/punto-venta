import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { IProvider } from "@/models/IProvider";
import { useStoreProvider, useUpdateProvider } from "@/services/useProvidersService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { isValidPhone, phoneValidationMessage } from "@/utils/phoneUtils";

export type ProviderForm = {
    name: string;
    phone: string;
    contact_name: string;
    notes: string;
};

const schema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(255, "Máximo 255 caracteres"),
    phone: Yup.string()
        .max(13, "Máximo 13 caracteres")
        .test("phone-valid", phoneValidationMessage, (v) => !v || isValidPhone(v)),
    contact_name: Yup.string().max(255, "Máximo 255 caracteres"),
    notes: Yup.string().max(1000, "Máximo 1000 caracteres"),
});

export const useProviderModal = (onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [editingProvider, setEditingProvider] = useState<IProvider | null>(null);
    const isEditing = editingProvider !== null;

    const { mutateAsync: storeProvider } = useStoreProvider();
    const { mutateAsync: updateProvider } = useUpdateProvider(editingProvider?.id ?? 0);

    const formik = useFormik<ProviderForm>({
        enableReinitialize: true,
        initialValues: {
            name: editingProvider?.name ?? "",
            phone: editingProvider?.phone ?? "",
            contact_name: editingProvider?.contact_name ?? "",
            notes: editingProvider?.notes ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            try {
                const payload = {
                    name: values.name.trim(),
                    phone: values.phone.trim() || null,
                    contact_name: values.contact_name.trim() || null,
                    notes: values.notes.trim() || null,
                };

                if (isEditing) {
                    await updateProvider(payload);
                    toast.success("Proveedor actualizado");
                } else {
                    await storeProvider(payload);
                    toast.success("Proveedor creado exitosamente");
                }

                helpers.resetForm();
                setEditingProvider(null);
                closeModal();
                onSuccess();
            } catch (error) {
                logUnexpectedError(error, "useProviderModal.onSubmit");
                toast.error(
                    getUserFacingErrorMessage(
                        error,
                        isEditing ? "Error al actualizar el proveedor" : "Error al crear el proveedor",
                    ),
                );
            }
        },
    });

    const openCreateModal = () => {
        setEditingProvider(null);
        openModal();
    };

    const openEditModal = (provider: IProvider) => {
        setEditingProvider(provider);
        openModal();
    };

    const handleClose = () => {
        formik.resetForm();
        setEditingProvider(null);
        closeModal();
    };

    return { isOpen, isEditing, editingProvider, openCreateModal, openEditModal, handleClose, formik };
};

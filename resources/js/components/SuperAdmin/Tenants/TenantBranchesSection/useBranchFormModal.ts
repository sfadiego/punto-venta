import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { useCreateTenantBranch, useUpdateTenantBranch } from "@/services/useTenantBranchService";
import { IBranch } from "@/models/IBranch";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export type BranchForm = {
    name: string;
    address: string;
};

const EMPTY_FORM: BranchForm = { name: "", address: "" };

const schema = Yup.object({
    name: Yup.string().required("El nombre es requerido").max(100, "Máximo 100 caracteres"),
    address: Yup.string().max(500, "Máximo 500 caracteres"),
});

// Un solo modal para alta y edición: comparten los mismos campos y validación, y la
// única diferencia real es a qué mutación se llama al enviar — separarlos en dos
// componentes solo hubiera duplicado el formulario/modal sin ninguna ganancia.
export const useBranchFormModal = (tenantId: number) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [editingBranch, setEditingBranch] = useState<IBranch | null>(null);
    const { mutateAsync: createBranch } = useCreateTenantBranch(tenantId);
    const { mutateAsync: updateBranch } = useUpdateTenantBranch(tenantId);

    const formik = useFormik<BranchForm>({
        initialValues: EMPTY_FORM,
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async (values, helpers) => {
            try {
                const payload = { name: values.name, address: values.address || null };

                if (editingBranch) {
                    await updateBranch({ id: editingBranch.id, data: payload });
                    toast.success("Sucursal actualizada correctamente");
                } else {
                    await createBranch(payload);
                    toast.success("Sucursal creada correctamente");
                }

                helpers.resetForm();
                closeModal();
            } catch (error) {
                toast.error(getUserFacingErrorMessage(
                    error,
                    editingBranch ? "Error al actualizar la sucursal" : "Error al crear la sucursal",
                ));
                helpers.setSubmitting(false);
            }
        },
    });

    const openCreate = () => {
        setEditingBranch(null);
        formik.resetForm({ values: EMPTY_FORM });
        openModal();
    };

    const openEdit = (branch: IBranch) => {
        setEditingBranch(branch);
        formik.resetForm({ values: { name: branch.name, address: branch.address ?? "" } });
        openModal();
    };

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openCreate, openEdit, handleClose, formik, isEdit: !!editingBranch };
};

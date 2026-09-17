import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useStoreBranch, useUpdateBranch } from "@/services/useBranchService";
import { IBranch } from "@/models/IBranch";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";

export type BranchForm = {
    name: string;
    address: string;
    phone: string;
};

const schema = Yup.object({
    name: Yup.string().trim().required("El nombre es requerido").max(100, "Máximo 100 caracteres"),
    address: Yup.string().max(500, "Máximo 500 caracteres"),
    phone: Yup.string().max(20, "Máximo 20 caracteres"),
});

export const useBranchFormModal = (branch: IBranch | null, onSuccess: () => void, onClose: () => void) => {
    const isEdit = !!branch;
    const { mutateAsync: storeBranch } = useStoreBranch();
    const { mutateAsync: updateBranch } = useUpdateBranch(branch?.id ?? 0);

    const formik = useFormik<BranchForm>({
        enableReinitialize: true,
        initialValues: {
            name: branch?.name ?? "",
            address: branch?.address ?? "",
            phone: branch?.phone ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            const payload = {
                name: values.name.trim(),
                address: values.address.trim() || null,
                phone: values.phone.trim() || null,
            };

            try {
                if (isEdit) {
                    await updateBranch(payload);
                    toast.success("Sucursal actualizada correctamente");
                } else {
                    await storeBranch(payload);
                    toast.success("Sucursal creada correctamente");
                    helpers.resetForm();
                }
                onSuccess();
                onClose();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);

                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                } else {
                    logUnexpectedError(error, "useBranchFormModal.onSubmit");
                    toast.error(getUserFacingErrorMessage(error, `Error al ${isEdit ? "actualizar" : "crear"} la sucursal`));
                }
            }
        },
    });

    return { isEdit, formik };
};

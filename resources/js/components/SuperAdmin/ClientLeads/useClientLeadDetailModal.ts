import { useFormik } from "formik";
import * as Yup from "yup";
import { IClientLead, IUpdateClientLeadPayload } from "@/models/IClientLead";
import { ClientLeadStatusEnum } from "@/enums/ClientLeadStatusEnum";

const schema = Yup.object({
    status: Yup.string().required("El estatus es requerido"),
    notes: Yup.string().nullable(),
});

export const useClientLeadDetailModal = (
    clientLead: IClientLead | null,
    onSave: (payload: IUpdateClientLeadPayload) => Promise<void>,
) => {
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            status: clientLead?.status ?? ClientLeadStatusEnum.FollowUp,
            notes: clientLead?.notes ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values) => {
            await onSave({
                status: values.status as ClientLeadStatusEnum,
                notes: values.notes || null,
            });
        },
    });

    return { formik };
};

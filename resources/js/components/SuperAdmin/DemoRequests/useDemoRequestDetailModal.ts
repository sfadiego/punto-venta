import { useFormik } from "formik";
import * as Yup from "yup";
import { IDemoRequest, IUpdateDemoRequestPayload } from "@/models/IDemoRequest";
import { DemoRequestStatusEnum } from "@/enums/DemoRequestStatusEnum";

const schema = Yup.object({
    status: Yup.string().required("El estatus es requerido"),
    notes: Yup.string().nullable(),
});

export const useDemoRequestDetailModal = (
    demoRequest: IDemoRequest | null,
    onSave: (payload: IUpdateDemoRequestPayload) => Promise<void>,
) => {
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            status: demoRequest?.status ?? DemoRequestStatusEnum.Pending,
            notes: demoRequest?.notes ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values) => {
            await onSave({
                status: values.status as DemoRequestStatusEnum,
                notes: values.notes || null,
            });
        },
    });

    return { formik };
};

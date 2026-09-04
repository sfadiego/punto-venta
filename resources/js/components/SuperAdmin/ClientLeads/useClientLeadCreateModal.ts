import { useFormik } from "formik";
import * as Yup from "yup";
import { BusinessNicheEnum } from "@/enums/BusinessNicheEnum";
import { ClientLeadStatusEnum } from "@/enums/ClientLeadStatusEnum";
import { IClientLeadCreatePayload } from "@/models/IClientLead";
import { isValidPhone, phoneValidationMessage } from "@/utils/phoneUtils";

export type ClientLeadCreateForm = {
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum | "";
    status: ClientLeadStatusEnum;
    notes: string;
};

const schema = Yup.object({
    business_name: Yup.string().required("El nombre del negocio es requerido"),
    email: Yup.string().email("Email inválido").required("El email es requerido"),
    phone: Yup.string()
        .required("El teléfono es requerido")
        .max(13, "El teléfono no puede tener más de 12 dígitos")
        .test("phone-valid", phoneValidationMessage, (v) => !v || isValidPhone(v)),
    business_niche: Yup.string().required("Selecciona el giro del negocio"),
    status: Yup.string().required("El estatus es requerido"),
    notes: Yup.string().nullable(),
});

export const useClientLeadCreateModal = (
    onSave: (payload: IClientLeadCreatePayload) => Promise<void>,
) => {
    const formik = useFormik<ClientLeadCreateForm>({
        initialValues: {
            business_name: "",
            email: "",
            phone: "",
            business_niche: "",
            status: ClientLeadStatusEnum.FollowUp,
            notes: "",
        },
        validationSchema: schema,
        onSubmit: async (values, { resetForm }) => {
            await onSave({
                business_name: values.business_name,
                email: values.email,
                phone: values.phone,
                business_niche: values.business_niche as BusinessNicheEnum,
                status: values.status,
                notes: values.notes || null,
            });
            resetForm();
        },
    });

    return { formik };
};

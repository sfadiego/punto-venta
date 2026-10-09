import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

export type EmptyReasonForm = {
    empty_close_reason: string;
};

const schema = Yup.object({
    empty_close_reason: Yup.string()
        .trim()
        .required("Indica el motivo para cerrar la caja")
        .min(5, "El motivo debe tener al menos 5 caracteres")
        .max(255, "Máximo 255 caracteres"),
});

// Motivo obligatorio para cerrar una caja sin ventas (ej. día festivo) — el backend lo exige y lo
// guarda en la sesión como parte de la auditoría de aperturas y cierres.
export const useCloseSalesEmptyReason = () => {
    const formik = useFormik<EmptyReasonForm>({
        initialValues: { empty_close_reason: "" },
        validationSchema: schema,
        onSubmit: () => {},
    });

    const reason = formik.values.empty_close_reason.trim();
    const isValid = useMemo(() => schema.isValidSync({ empty_close_reason: reason }), [reason]);

    return { formik, reason, isValid };
};

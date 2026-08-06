import * as Yup from "yup";

export type AbsenceForm = {
    date: string;
    notified: boolean;
    deduction_amount: string;
    notes: string;
};

export const absenceSchema = Yup.object({
    date: Yup.string().required("La fecha es requerida"),
    notified: Yup.boolean().required(),
    deduction_amount: Yup.number()
        .typeError("El monto debe ser un número")
        .min(0, "El monto no puede ser negativo")
        .when("notified", {
            is: false,
            then: (schema) => schema.required("Captura el monto a descontar"),
            otherwise: (schema) => schema.notRequired(),
        }),
    notes: Yup.string().max(500, "Máximo 500 caracteres"),
});

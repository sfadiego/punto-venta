import { useState } from "react";
import { FormikProps } from "formik";
import { Textarea } from "@/components/ui/form/textarea";
import { IOrderReturnForm } from "@/models/IOrderReturnForm";

interface ReturnNoteFieldProps {
    formik: FormikProps<IOrderReturnForm>;
}

// La nota es opcional: queda plegada tras "+ Agregar nota" para no gastar espacio, y se muestra
// abierta si ya trae texto.
export const ReturnNoteField = ({ formik }: ReturnNoteFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen && formik.values.note === "") {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="self-start text-sm text-stone-500 transition-colors hover:text-stone-700"
            >
                + Agregar nota
            </button>
        );
    }

    return (
        <Textarea<IOrderReturnForm>
            name="note"
            placeholder="Ej: la pieza llegó rota"
            formik={formik}
            rows={2}
        />
    );
};

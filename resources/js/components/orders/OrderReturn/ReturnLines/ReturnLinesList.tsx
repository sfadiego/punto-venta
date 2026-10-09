import { FormikProps, getIn } from "formik";
import { IReturnLineEntry } from "@/utils/returnCalc";
import { IOrderReturnForm } from "@/models/IOrderReturnForm";
import { ReturnLineRow } from "./ReturnLineRow";

interface ReturnLinesListProps {
    entries: IReturnLineEntry[];
    formik: FormikProps<IOrderReturnForm>;
    onToggleLine: (index: number, selected: boolean) => void;
    onQuantityChange: (index: number, quantity: string) => void;
}

// Productos de la orden, con su propio desplazamiento: la altura se acota al alto de la ventana
// para que el motivo y el botón de abajo siempre queden a la vista, sin importar cuántos productos
// tenga la venta. Cada fila conserva el índice de su línea aunque el orden de la lista cambie.
export const ReturnLinesList = ({ entries, formik, onToggleLine, onQuantityChange }: ReturnLinesListProps) => {
    // El error "selecciona al menos un producto" cuelga de `items` como texto; solo se muestra tras intentar enviar.
    const listError = formik.submitCount > 0 && typeof formik.errors.items === "string" ? formik.errors.items : null;

    return (
        <div>
            <div
                className={`max-h-[calc(100vh-42rem)] min-h-40 overflow-y-auto rounded-xl border ${listError ? "border-red-400" : "border-stone-200"}`}
            >
                {entries.map(({ line, index }) => {
                    // Al cargarse la orden, las líneas llegan un render antes de que Formik
                    // reinicie sus valores (enableReinitialize) — ese instante no hay valor aún.
                    const value = formik.values.items[index];
                    if (!value) return null;

                    return (
                        <ReturnLineRow
                            key={line.id}
                            line={line}
                            value={value}
                            error={getIn(formik.errors, `items[${index}].quantity`)}
                            onToggle={(selected) => onToggleLine(index, selected)}
                            onQuantityChange={(quantity) => onQuantityChange(index, quantity)}
                        />
                    );
                })}
            </div>
            {listError && <p className="mt-1 text-xs text-red-500">{listError}</p>}
        </div>
    );
};

import { FormikProps } from "formik";
import { Textarea } from "@/components/ui/form/textarea";
import { EmptyReasonForm } from "@/pages/CloseSales/useCloseSalesEmptyReason";

interface CloseSalesEmptySessionNoticeProps {
    formik: FormikProps<EmptyReasonForm>;
}

// Una sesión sin ventas se puede cerrar (un día sin ventas es legítimo), pero con motivo: así no se
// abren y cierran cajas sin control y queda evidencia de por qué se cerró vacía.
export const CloseSalesEmptySessionNotice = ({ formik }: CloseSalesEmptySessionNoticeProps) => (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 mb-4 space-y-3">
        <div className="flex items-start gap-3 text-sm text-amber-700">
            <span className="shrink-0">⚠️</span>
            <span>
                No hay ventas registradas en esta sesión. Puedes cerrarla indicando el motivo (por ejemplo, día festivo o sin
                ventas). Quedará guardado junto con quién la cerró.
            </span>
        </div>
        <Textarea<EmptyReasonForm>
            name="empty_close_reason"
            label="Motivo del cierre sin ventas"
            placeholder="Ej. Día festivo, la tienda no abrió"
            rows={2}
            maxLength={255}
            formik={formik}
        />
    </div>
);

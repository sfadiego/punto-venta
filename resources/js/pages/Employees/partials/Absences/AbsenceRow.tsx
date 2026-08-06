import { Trash2 } from "lucide-react";
import { IEmployeeAbsence } from "@/models/IEmployeeAbsence";
import { formatDateLabel } from "@/utils/dateUtils";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";

interface AbsenceRowProps {
    absence: IEmployeeAbsence;
    onDelete: (id: number) => void;
}

export const AbsenceRow = ({ absence, onDelete }: AbsenceRowProps) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-stone-100 last:border-0">
        <div className="min-w-0">
            <p className="text-sm text-stone-700 truncate">{formatDateLabel(absence.date)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
                <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                        absence.notified ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}
                >
                    {absence.notified ? "Justificada" : "Injustificada"}
                </span>
                {absence.notes && <span className="text-xs text-stone-400 truncate">{absence.notes}</span>}
            </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
            {!absence.notified && absence.deduction_amount !== null && (
                <span className="text-sm font-semibold text-red-600">-{formatCurrency(Number(absence.deduction_amount))}</span>
            )}
            <button
                type="button"
                onClick={() => onDelete(absence.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
);

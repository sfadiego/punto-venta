import { CalendarOff, Loader, Plus } from "lucide-react";
import { IEmployee } from "@/models/IEmployee";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";
import { AbsenceRow } from "./AbsenceRow";
import { AbsenceModal } from "./AbsenceModal";
import { useAbsencesSection } from "./useAbsencesSection";

interface AbsencesSectionProps {
    employee: IEmployee;
}

export const AbsencesSection = ({ employee }: AbsencesSectionProps) => {
    const { absences, isLoading, currentPeriodDeduction, handleDelete, absenceModal } = useAbsencesSection(employee);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <CalendarOff size={16} className="text-red-600" />
                    </div>
                    <h2 className="font-semibold text-stone-900 text-sm">Faltas</h2>
                </div>
                <button
                    type="button"
                    onClick={absenceModal.openModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                >
                    <Plus size={14} />
                    Registrar falta
                </button>
            </div>

            {currentPeriodDeduction > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Descuento de este periodo</p>
                    <p className="text-2xl font-bold text-red-600 mt-0.5">-{formatCurrency(currentPeriodDeduction)}</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader size={18} className="animate-spin text-stone-300" />
                </div>
            ) : absences.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">Sin faltas registradas</p>
            ) : (
                <div>
                    {absences.map((absence) => (
                        <AbsenceRow key={absence.id} absence={absence} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <AbsenceModal isOpen={absenceModal.isOpen} formik={absenceModal.formik} onClose={absenceModal.handleClose} />
        </div>
    );
};

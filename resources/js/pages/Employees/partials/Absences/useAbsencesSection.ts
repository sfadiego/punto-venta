import { useMemo } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IEmployee } from "@/models/IEmployee";
import { useIndexEmployeeAbsences, useDeleteEmployeeAbsence } from "@/services/useEmployeeAbsenceService";
import { getCurrentPeriodRange, isDateInRange } from "@/utils/absenceDeductionUtils";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useAbsenceModal } from "./useAbsenceModal";

export const useAbsencesSection = (employee: IEmployee) => {
    const { data: absences = [], isLoading, refetch } = useIndexEmployeeAbsences(employee.id);
    const { mutateAsync: deleteAbsence } = useDeleteEmployeeAbsence(employee.id);
    const absenceModal = useAbsenceModal(employee.id, employee.salary, employee.salary_period, refetch);

    const periodRange = useMemo(() => getCurrentPeriodRange(employee.salary_period), [employee.salary_period]);

    const currentPeriodDeduction = useMemo(() => {
        return absences
            .filter((a) => !a.notified && isDateInRange(a.date, periodRange))
            .reduce((sum, a) => sum + Number(a.deduction_amount ?? 0), 0);
    }, [absences, periodRange]);

    const handleDelete = async (absenceId: number) => {
        const result = await Swal.fire({
            title: "¿Eliminar falta?",
            text: "Se eliminará el registro y su descuento asociado.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        try {
            await deleteAbsence(absenceId);
            toast.success("Falta eliminada");
        } catch (error) {
            logUnexpectedError(error, "useAbsencesSection.handleDelete");
            toast.error(getUserFacingErrorMessage(error, "No se pudo eliminar la falta"));
        }
    };

    return { absences, isLoading, currentPeriodDeduction, handleDelete, absenceModal };
};

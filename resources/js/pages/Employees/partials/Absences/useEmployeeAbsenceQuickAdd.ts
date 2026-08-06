import { useState } from "react";
import { IEmployee } from "@/models/IEmployee";
import { useAbsenceModal } from "./useAbsenceModal";

/** Variante de useAbsenceModal para disparar el modal de "Registrar falta" desde fuera de
 *  EmployeeDetailPage (ej. la columna de acciones del listado), donde el empleado objetivo
 *  se decide en el momento del click en vez de venir fijo por props/ruta. */
export const useEmployeeAbsenceQuickAdd = () => {
    const [employee, setEmployee] = useState<IEmployee | null>(null);
    const absenceModal = useAbsenceModal(
        employee?.id ?? 0,
        employee?.salary ?? 0,
        employee?.salary_period ?? "monthly",
        () => {},
    );

    const openFor = (target: IEmployee) => {
        setEmployee(target);
        absenceModal.openModal();
    };

    const handleClose = () => {
        absenceModal.handleClose();
        setEmployee(null);
    };

    return { ...absenceModal, employee, openFor, handleClose };
};

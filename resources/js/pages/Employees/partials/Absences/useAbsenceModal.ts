import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { SalaryPeriod } from "@/models/IEmployee";
import { useStoreEmployeeAbsence } from "@/services/useEmployeeAbsenceService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { localDateString } from "@/utils/dateUtils";
import { getSuggestedDeductionAmount } from "@/utils/absenceDeductionUtils";
import { AbsenceForm, absenceSchema } from "./absenceForm";

export const useAbsenceModal = (employeeId: number, salary: number | string, salaryPeriod: SalaryPeriod, onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const { mutateAsync: storeAbsence } = useStoreEmployeeAbsence(employeeId);

    const formik = useFormik<AbsenceForm>({
        enableReinitialize: true,
        initialValues: {
            date: localDateString(),
            notified: false,
            deduction_amount: getSuggestedDeductionAmount(salary, salaryPeriod).toFixed(2),
            notes: "",
        },
        validationSchema: absenceSchema,
        onSubmit: async (values, helpers) => {
            try {
                await storeAbsence({
                    date: values.date,
                    notified: values.notified,
                    deduction_amount: values.notified ? null : Number(values.deduction_amount),
                    notes: values.notes.trim() || null,
                });

                toast.success(values.notified ? "Falta registrada" : "Falta registrada y descuento aplicado");
                helpers.resetForm();
                closeModal();
                onSuccess();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);

                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                } else {
                    logUnexpectedError(error, "useAbsenceModal.onSubmit");
                    toast.error(getUserFacingErrorMessage(error, "Error al registrar la falta"));
                }
            }
        },
    });

    const handleClose = () => {
        formik.resetForm();
        closeModal();
    };

    return { isOpen, openModal, handleClose, formik };
};

import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { SalaryPeriod } from "@/models/IEmployee";
import { useStoreEmployeeAbsence } from "@/services/useEmployeeAbsenceService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { localDateString } from "@/utils/dateUtils";
import { getSuggestedDeductionAmount } from "@/utils/absenceDeductionUtils";
import { formatMoney } from "@/utils/formatCurrency";
import { AbsenceForm, absenceSchema } from "./absenceForm";
import { trimOrNull } from "@/utils/textUtils";

export const useAbsenceModal = (employeeId: number, salary: number | string, salaryPeriod: SalaryPeriod, onSuccess: () => void) => {
    const { isOpen, openModal, closeModal } = useModal();
    const { mutateAsync: storeAbsence } = useStoreEmployeeAbsence(employeeId);

    const formik = useFormik<AbsenceForm>({
        enableReinitialize: true,
        initialValues: {
            date: localDateString(),
            notified: false,
            deduct: true,
            deduction_amount: formatMoney(getSuggestedDeductionAmount(salary, salaryPeriod)),
            notes: "",
        },
        validationSchema: absenceSchema,
        onSubmit: async (values, helpers) => {
            try {
                await storeAbsence({
                    date: values.date,
                    notified: values.notified,
                    deduction_amount: values.deduct ? Number(values.deduction_amount) : null,
                    notes: trimOrNull(values.notes),
                });

                toast.success(values.deduct ? "Falta registrada y descuento aplicado" : "Falta registrada");
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

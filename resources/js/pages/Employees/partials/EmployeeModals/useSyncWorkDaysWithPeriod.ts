import { useEffect, useRef } from "react";
import { FormikProps } from "formik";
import { SALARY_PERIOD_DEFAULT_WORK_DAYS } from "@/utils/salaryPeriodUtils";
import { EmployeeForm } from "./employeeForm";

/** Autocompleta los días trabajados cuando el usuario cambia la periodicidad a diario/semanal/
 *  fin de semana. Solo dispara al cambiar el valor (no en el montaje inicial), y no bloquea los
 *  checkboxes — el usuario puede seguir des/marcando días individuales después. */
export const useSyncWorkDaysWithPeriod = (formik: FormikProps<EmployeeForm>) => {
    const previousPeriod = useRef(formik.values.salary_period);

    useEffect(() => {
        if (previousPeriod.current === formik.values.salary_period) return;
        previousPeriod.current = formik.values.salary_period;

        const defaultDays = SALARY_PERIOD_DEFAULT_WORK_DAYS[formik.values.salary_period];
        if (defaultDays) {
            formik.setFieldValue("work_days", defaultDays);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.salary_period]);
};

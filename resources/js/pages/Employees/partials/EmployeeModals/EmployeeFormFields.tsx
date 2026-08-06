import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { sanitizePhoneInput } from "@/utils/phoneUtils";
import { WorkDay } from "@/models/IEmployee";
import { EmployeeForm } from "./employeeForm";
import { SelectSalaryPeriod } from "./SelectSalaryPeriod";
import { WorkDaysCheckboxGroup } from "./WorkDaysCheckboxGroup";
import { SalaryEstimateCard } from "./SalaryEstimateCard";
import { SalaryTotalCard } from "./SalaryTotalCard";
import { useSyncWorkDaysWithPeriod } from "./useSyncWorkDaysWithPeriod";
import { isPerDaySalaryPeriod, SALARY_AMOUNT_FIELD_LABELS } from "@/utils/salaryPeriodUtils";

interface EmployeeFormFieldsProps {
    formik: FormikProps<EmployeeForm>;
}

export const EmployeeFormFields = ({ formik }: EmployeeFormFieldsProps) => {
    useSyncWorkDaysWithPeriod(formik);
    const perDayPeriod = isPerDaySalaryPeriod(formik.values.salary_period);

    return (
        <div className="space-y-4">
            <Input name="name" label="Nombre" placeholder="Ej: Juan Pérez" maxLength={255} formik={formik} />
            <Input
                name="phone"
                label="Teléfono"
                placeholder="Ej: 5512345678"
                maxLength={13}
                value={formik.values.phone}
                onChange={(e) => formik.setFieldValue("phone", sanitizePhoneInput(e.target.value))}
                onBlur={formik.handleBlur}
                error={formik.touched.phone ? formik.errors.phone : undefined}
            />
            <div className="flex gap-3">
                <Input
                    name="salary"
                    label={SALARY_AMOUNT_FIELD_LABELS[formik.values.salary_period]}
                    inputType="number"
                    placeholder="Ej: 300"
                    min={0}
                    step={0.01}
                    formik={formik}
                />
                <SelectSalaryPeriod<EmployeeForm> name="salary_period" label="Periodicidad de pago" formik={formik} />
            </div>
            <SalaryTotalCard
                dailySalary={Number(formik.values.salary) || 0}
                period={formik.values.salary_period}
                workDays={formik.values.work_days}
            />
            <SalaryEstimateCard
                dailySalary={Number(formik.values.salary) || 0}
                period={formik.values.salary_period}
                workDays={formik.values.work_days}
            />
            <WorkDaysCheckboxGroup
                label={perDayPeriod ? "Días que trabaja" : "Días laborales (opcional, solo referencia de horario)"}
                value={formik.values.work_days}
                onChange={(days: WorkDay[]) => formik.setFieldValue("work_days", days)}
                error={perDayPeriod && formik.touched.work_days ? (formik.errors.work_days as string | undefined) : undefined}
            />
        </div>
    );
};

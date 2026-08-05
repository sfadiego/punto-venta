import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { SALARY_PERIOD_LABELS } from "@/utils/salaryPeriodUtils";

const SALARY_PERIOD_OPTIONS = Object.entries(SALARY_PERIOD_LABELS).map(([value, label]) => ({
    value,
    label,
}));

interface SelectSalaryPeriodProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectSalaryPeriod = <T,>({ name, formik, label, disabled, className }: SelectSalaryPeriodProps<T>) => (
    <Select<T> name={name} options={SALARY_PERIOD_OPTIONS} formik={formik} label={label} disabled={disabled} className={className} />
);

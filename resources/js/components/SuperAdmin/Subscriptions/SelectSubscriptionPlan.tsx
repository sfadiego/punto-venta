import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { SubscriptionPlanEnum, PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";

const PLAN_OPTIONS = Object.values(SubscriptionPlanEnum).map((value) => ({
    value,
    label: PLAN_LABELS[value],
}));

interface SelectSubscriptionPlanProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectSubscriptionPlan = <T,>({
    name,
    formik,
    label,
    disabled,
    className,
}: SelectSubscriptionPlanProps<T>) => (
    <Select<T>
        name={name}
        options={PLAN_OPTIONS}
        formik={formik}
        label={label}
        disabled={disabled}
        className={className}
    />
);

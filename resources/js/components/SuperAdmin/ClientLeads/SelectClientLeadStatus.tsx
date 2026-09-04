import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { CLIENT_LEAD_STATUS_LABELS } from "@/enums/ClientLeadStatusEnum";

const STATUS_OPTIONS = Object.entries(CLIENT_LEAD_STATUS_LABELS).map(
    ([value, label]) => ({ value, label }),
);

interface SelectClientLeadStatusProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectClientLeadStatus = <T,>({
    name,
    formik,
    label = "Estatus",
    disabled,
    className,
}: SelectClientLeadStatusProps<T>) => (
    <Select<T>
        name={name}
        options={STATUS_OPTIONS}
        formik={formik}
        label={label}
        disabled={disabled}
        className={className}
    />
);

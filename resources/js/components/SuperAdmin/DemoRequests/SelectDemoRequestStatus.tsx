import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { DEMO_REQUEST_STATUS_LABELS } from "@/enums/DemoRequestStatusEnum";

const STATUS_OPTIONS = Object.entries(DEMO_REQUEST_STATUS_LABELS).map(
    ([value, label]) => ({ value, label }),
);

interface SelectDemoRequestStatusProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectDemoRequestStatus = <T,>({
    name,
    formik,
    label = "Estatus",
    disabled,
    className,
}: SelectDemoRequestStatusProps<T>) => (
    <Select<T>
        name={name}
        options={STATUS_OPTIONS}
        formik={formik}
        label={label}
        disabled={disabled}
        className={className}
    />
);

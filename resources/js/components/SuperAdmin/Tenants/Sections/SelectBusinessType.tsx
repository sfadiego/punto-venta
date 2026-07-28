import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { BusinessTypeEnum, BUSINESS_TYPE_LABELS } from "@/enums/BusinessTypeEnum";

const BUSINESS_TYPE_OPTIONS = Object.values(BusinessTypeEnum).map((value) => ({
    value,
    label: BUSINESS_TYPE_LABELS[value],
}));

interface SelectBusinessTypeProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectBusinessType = <T,>({
    name,
    formik,
    label = "Tipo de negocio",
    disabled,
    className,
}: SelectBusinessTypeProps<T>) => (
    <Select<T>
        name={name}
        options={BUSINESS_TYPE_OPTIONS}
        formik={formik}
        label={label}
        disabled={disabled}
        className={className}
    />
);

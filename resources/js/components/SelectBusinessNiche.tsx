import { FormikProps } from "formik";
import { Select } from "@/components/ui/form/Select";
import { BUSINESS_NICHE_LABELS } from "@/enums/BusinessNicheEnum";

const NICHE_OPTIONS = Object.entries(BUSINESS_NICHE_LABELS).map(
    ([value, label]) => ({ value, label }),
);

interface SelectBusinessNicheProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectBusinessNiche = <T,>({
    name,
    formik,
    label,
    placeholder = "Giro de tu negocio",
    disabled,
    className,
}: SelectBusinessNicheProps<T>) => (
    <Select<T>
        name={name}
        options={NICHE_OPTIONS}
        formik={formik}
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
    />
);

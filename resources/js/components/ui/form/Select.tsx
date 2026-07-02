import { FormikProps } from "formik";

type SelectStyleTypes = "default" | "error" | "none";

const selectVariant: Record<SelectStyleTypes, string> = {
    error:   "border-red-400 bg-red-50",
    default: "border-stone-300",
    none:    "",
};

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps<T> {
    name: Extract<keyof T, string>;
    options: SelectOption[];
    formik?: FormikProps<T>;
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    selectStyle?: SelectStyleTypes;
}

export const Select = <T,>({
    name,
    options,
    formik,
    value: controlledValue,
    onChange: controlledOnChange,
    label = "",
    placeholder = "",
    disabled = false,
    className = "",
    selectStyle = "default",
}: SelectProps<T>) => {
    const touched  = Boolean(formik?.touched[name as keyof T]);
    const hasError = Boolean(formik?.errors[name as keyof T]);
    const showError = (touched || (formik?.submitCount ?? 0) > 0) && hasError;

    const styleVariant = selectVariant[showError ? "error" : selectStyle];
    const fieldProps = formik
        ? formik.getFieldProps(name)
        : {
              value: controlledValue ?? "",
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                  controlledOnChange?.(e.target.value),
          };

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={name}
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <select
                id={name}
                disabled={disabled}
                {...fieldProps}
                className={`w-full px-4 py-3 border rounded-xl text-sm text-stone-900
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                    transition-shadow disabled:bg-stone-100 disabled:cursor-not-allowed
                    ${styleVariant} ${className}`}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {showError && (
                <p className="text-red-500 text-xs mt-1">
                    {String(formik!.errors[name])}
                </p>
            )}
        </div>
    );
};

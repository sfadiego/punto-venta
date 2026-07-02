import { FormikProps } from "formik";

type TextareaStyleTypes = "default" | "error" | "none";

const textareaVariant: Record<TextareaStyleTypes, string> = {
    error:   "border-red-400 bg-red-50",
    default: "border-stone-300",
    none:    "",
};

interface TextareaProps<T> {
    className?: string;
    textareaStyle?: TextareaStyleTypes;
    name: Extract<keyof T, string>;
    placeholder?: string;
    formik?: FormikProps<T>;
    disabled?: boolean;
    label?: string;
    rows?: number;
}

export const Textarea = <T,>({
    label = "",
    formik,
    placeholder = "",
    name,
    textareaStyle = "default",
    className = "",
    disabled = false,
    rows = 3,
}: TextareaProps<T>) => {
    const touched = Boolean(formik?.touched[name as keyof T]);
    const hasError = Boolean(formik?.errors[name as keyof T]);
    const showError = (touched || (formik?.submitCount ?? 0) > 0) && hasError;

    const styleVariant = textareaVariant[showError ? "error" : textareaStyle] || "";
    const fieldProps = formik ? formik.getFieldProps(name) : {};

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
            <textarea
                id={name}
                rows={rows}
                disabled={disabled}
                placeholder={placeholder}
                {...fieldProps}
                className={`w-full px-4 py-3 border rounded-xl text-sm text-stone-900
                    placeholder-stone-400 focus:outline-none focus:ring-2
                    focus:ring-amber-500 focus:border-transparent transition-shadow
                    disabled:bg-stone-100 disabled:cursor-not-allowed resize-none
                    ${styleVariant} ${className}`}
            />
            {showError && (
                <p className="text-red-500 text-xs mt-1">
                    {String(formik!.errors[name])}
                </p>
            )}
        </div>
    );
};

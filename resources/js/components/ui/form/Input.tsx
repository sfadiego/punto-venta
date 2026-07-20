import { FormikProps } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type InputStyleTypes = "default" | "error" | "none" | "outlined";
type InputTypes = "email" | "text" | "password" | "tel" | "number" | "url" | "search";

const inputVariant: Record<InputStyleTypes, string> = {
    error: "border-red-400 bg-red-50",
    default: "border-stone-300",
    outlined: "border-stone-400 hover:border-stone-600 bg-white",
    none: "",
};

interface InputProps<T> {
    className?: string;
    inputStyle?: InputStyleTypes;
    name: Extract<keyof T, string>;
    placeholder?: string;
    inputType?: InputTypes;
    formik?: FormikProps<T>;
    disabled?: boolean;
    label?: string;
    autoComplete?: string;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    min?: number;
    max?: number;
    step?: number;
    maxLength?: number;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export const Input = <T = Record<string, string>,>({
    label = "",
    formik,
    inputType = "text",
    placeholder = "",
    name,
    inputStyle = "default",
    className = "",
    disabled = false,
    autoComplete,
    onFocus,
    min,
    max,
    step,
    maxLength,
    value,
    onChange,
    onBlur,
    onKeyDown,
}: InputProps<T>) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = inputType === "password";

    const touched = Boolean(formik?.touched[name as keyof T]);
    const hasError = Boolean(formik?.errors[name as keyof T]);
    const showError = (touched || (formik?.submitCount ?? 0) > 0) && hasError;

    const styleVariant = inputVariant[showError ? "error" : inputStyle] || "";
    const fieldProps = formik
        ? formik.getFieldProps(name)
        : { value: value ?? "", onChange };
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : inputType;

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
            <div className={isPassword ? "relative" : undefined}>
                <input
                    id={name}
                    type={resolvedType}
                    disabled={disabled}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    onFocus={onFocus}
                    min={min}
                    max={max}
                    step={step}
                    maxLength={maxLength}
                    {...fieldProps}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className={`w-full px-4 py-3 border rounded-xl text-sm text-stone-900
                        placeholder-stone-400 focus:outline-none focus:ring-2
                        focus:ring-amber-500 focus:border-transparent transition-all
                        hover:border-stone-400
                        disabled:bg-stone-100 disabled:cursor-not-allowed disabled:hover:border-stone-300
                        ${isPassword ? "pr-12" : ""}
                        ${styleVariant} ${className}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {showError && (
                <p className="text-red-500 text-xs mt-1">
                    {String(formik!.errors[name])}
                </p>
            )}
        </div>
    );
};

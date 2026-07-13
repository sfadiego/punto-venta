import { useRef, useEffect } from "react";
import { Loader, MapPin } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";

interface AddressAutocompleteProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formik: FormikProps<any>;
    name: string;
    label: string;
    placeholder?: string;
}

export const AddressAutocomplete = ({ formik, name, label, placeholder }: AddressAutocompleteProps) => {
    const value: string = formik.values[name] ?? "";
    const { suggestions, isLoading, open, setOpen, select } = useAddressAutocomplete(value);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [setOpen]);

    return (
        <div ref={containerRef} className="relative">
            <Input
                formik={formik}
                name={name}
                label={label}
                placeholder={placeholder}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
            />

            {isLoading && (
                <div className="absolute right-3 top-9">
                    <Loader size={14} className="animate-spin text-stone-400" />
                </div>
            )}

            {open && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                    {suggestions.map((s) => (
                        <li key={s.place_id}>
                            <button
                                type="button"
                                onClick={() => select(s, (v) => formik.setFieldValue(name, v))}
                                className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-start gap-2 border-b border-stone-100 last:border-0"
                            >
                                <MapPin size={12} className="mt-0.5 shrink-0 text-stone-400" />
                                <span className="leading-relaxed">{s.display_name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

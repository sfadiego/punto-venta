import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/form/Input";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    /** Clases del contenedor (ancho, flex) para ubicarlo en la barra de filtros. */
    className?: string;
}

// Buscador con icono de lupa y botón para borrar el texto. El botón nativo de `type="search"` se
// oculta para no mostrar dos "X" en los navegadores que lo dibujan.
export const SearchInput = ({ value, onChange, placeholder, className = "" }: SearchInputProps) => (
    <div className={`relative ${className}`}>
        <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <Input
            name="search"
            inputType="search"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
            <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Borrar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            >
                <X size={16} />
            </button>
        )}
    </div>
);

import { Search } from "lucide-react";
import { Input } from "@/components/ui/form/Input";

interface CategorySearchProps {
    value: string;
    onChange: (value: string) => void;
}

export const CategorySearch = ({ value, onChange }: CategorySearchProps) => (
    <div className="relative">
        <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <Input
            name="search"
            inputType="search"
            placeholder="Buscar categoría..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9"
        />
    </div>
);

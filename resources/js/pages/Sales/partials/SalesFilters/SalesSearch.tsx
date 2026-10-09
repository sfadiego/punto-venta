import { Search } from "lucide-react";
import { Input } from "@/components/ui/form/Input";

interface SalesSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export const SalesSearch = ({ value, onChange }: SalesSearchProps) => (
    <div className="relative flex-1 min-w-[220px] lg:max-w-sm">
        <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 z-10 pointer-events-none"
        />
        <Input
            name="search"
            inputType="search"
            placeholder="Buscar por folio o cliente..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9"
        />
    </div>
);

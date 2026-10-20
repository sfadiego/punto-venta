import { FileSpreadsheet, FileText, LucideIcon } from "lucide-react";
import { CatalogExportFormatEnum } from "@/enums/CatalogExportFormatEnum";

interface FormatOption {
    value: CatalogExportFormatEnum;
    label: string;
    description: string;
    icon: LucideIcon;
}

const FORMAT_OPTIONS: FormatOption[] = [
    { value: CatalogExportFormatEnum.Csv, label: "CSV", description: "Para abrir en Excel", icon: FileSpreadsheet },
    { value: CatalogExportFormatEnum.Pdf, label: "PDF", description: "Para imprimir o consultar", icon: FileText },
];

interface CatalogFormatSelectorProps {
    value: CatalogExportFormatEnum;
    onChange: (format: CatalogExportFormatEnum) => void;
}

export const CatalogFormatSelector = ({ value, onChange }: CatalogFormatSelectorProps) => (
    <div role="radiogroup" aria-label="Formato del catálogo" className="grid grid-cols-2 gap-2">
        {FORMAT_OPTIONS.map(({ value: optionValue, label, description, icon: Icon }) => {
            const isSelected = optionValue === value;

            return (
                <button
                    key={optionValue}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onChange(optionValue)}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-center transition-colors ${
                        isSelected
                            ? "border-amber-500 bg-amber-50 text-stone-900"
                            : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
                    }`}
                >
                    <Icon size={20} className={isSelected ? "text-amber-600" : "text-stone-400"} />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-[11px] leading-tight text-stone-400">{description}</span>
                </button>
            );
        })}
    </div>
);

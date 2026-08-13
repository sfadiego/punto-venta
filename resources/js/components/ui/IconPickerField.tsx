import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { IconPickerModal } from "@/components/ui/IconPickerModal";
import { IconSourceEnum } from "@/enums/IconSourceEnum";

interface IconPickerFieldProps {
    iconName: string;
    iconSource: IconSourceEnum | string;
    onChange: (iconName: string, iconSource: IconSourceEnum) => void;
    label?: string;
}

export const IconPickerField = ({ iconName, iconSource, onChange, label = "Ícono" }: IconPickerFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
                <span className="w-9 h-9 shrink-0 rounded-lg border border-stone-200 bg-white flex items-center justify-center">
                    <CatalogIcon iconName={iconName} iconSource={iconSource} size={16} className="text-stone-500" />
                </span>
                <span className="text-sm text-stone-600 flex-1 text-left">
                    {iconName ? "Cambiar ícono" : "Elegir ícono"}
                </span>
                <ChevronRight size={16} className="text-stone-400" />
            </button>

            <IconPickerModal
                isOpen={isOpen}
                iconName={iconName}
                iconSource={iconSource}
                onChange={onChange}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};

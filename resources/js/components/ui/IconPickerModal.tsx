import { X } from "lucide-react";
import { IconSourceEnum } from "@/enums/IconSourceEnum";
import { IconSourcePicker } from "@/components/ui/IconSourcePicker";

interface IconPickerModalProps {
    isOpen: boolean;
    iconName: string;
    iconSource: IconSourceEnum | string;
    onChange: (iconName: string, iconSource: IconSourceEnum) => void;
    onClose: () => void;
}

export const IconPickerModal = ({ isOpen, iconName, iconSource, onChange, onClose }: IconPickerModalProps) => {
    if (!isOpen) return null;

    const handleChange = (name: string, source: IconSourceEnum) => {
        onChange(name, source);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden h-[70vh] max-h-[560px] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100 shrink-0">
                    <h3 className="font-semibold text-stone-900 text-sm">Elegir ícono</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 flex-1 min-h-0">
                    <IconSourcePicker iconName={iconName} iconSource={iconSource} onChange={handleChange} />
                </div>
            </div>
        </div>
    );
};

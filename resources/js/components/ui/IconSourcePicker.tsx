import { useState } from "react";
import { Search } from "lucide-react";
import { IconSourceEnum } from "@/enums/IconSourceEnum";
import { IconPicker } from "@/components/ui/IconPicker";
import { OpenmojiPicker } from "@/components/ui/OpenmojiPicker";

interface IconSourcePickerProps {
    iconName: string;
    iconSource: IconSourceEnum | string;
    onChange: (iconName: string, iconSource: IconSourceEnum) => void;
}

const TABS: { source: IconSourceEnum; label: string }[] = [
    { source: IconSourceEnum.Lucide, label: "Íconos" },
    { source: IconSourceEnum.Openmoji, label: "Imágenes" },
];

export const IconSourcePicker = ({ iconName, iconSource, onChange }: IconSourcePickerProps) => {
    const [tab, setTab] = useState<IconSourceEnum>(
        iconSource === IconSourceEnum.Openmoji ? IconSourceEnum.Openmoji : IconSourceEnum.Lucide,
    );
    const [search, setSearch] = useState("");

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex gap-1 mb-2.5 bg-stone-100 rounded-lg p-1 shrink-0">
                {TABS.map(({ source, label }) => (
                    <button
                        key={source}
                        type="button"
                        onClick={() => setTab(source)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            tab === source
                                ? "bg-white text-stone-900 shadow-sm"
                                : "text-stone-500 hover:text-stone-700"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="relative mb-3 shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar ícono..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {tab === IconSourceEnum.Lucide ? (
                    <IconPicker
                        value={iconSource === IconSourceEnum.Lucide ? iconName : ""}
                        search={search}
                        onSelect={(name) => onChange(name, IconSourceEnum.Lucide)}
                    />
                ) : (
                    <OpenmojiPicker
                        value={iconSource === IconSourceEnum.Openmoji ? iconName : ""}
                        search={search}
                        onSelect={(key) => onChange(key, IconSourceEnum.Openmoji)}
                    />
                )}
            </div>
        </div>
    );
};

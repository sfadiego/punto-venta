import { groupOpenmojiCatalog, getOpenmojiIconPath } from "@/utils/iconAssets";

interface OpenmojiPickerProps {
    value: string;
    search?: string;
    onSelect: (key: string) => void;
}

export const OpenmojiPicker = ({ value, search = "", onSelect }: OpenmojiPickerProps) => {
    const groups = groupOpenmojiCatalog(search);

    if (groups.length === 0) {
        return <p className="text-sm text-stone-400 text-center py-6">Sin resultados para &quot;{search}&quot;</p>;
    }

    return (
        <div className="space-y-3">
            {groups.map(([group, icons]) => (
                <div key={group}>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
                        {group}
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                        {icons.map((icon) => {
                            const isSelected = value === icon.key;

                            return (
                                <button
                                    key={icon.key}
                                    type="button"
                                    onClick={() => onSelect(icon.key)}
                                    title={icon.label}
                                    className={`aspect-square rounded-xl border flex items-center justify-center transition-colors ${
                                        isSelected
                                            ? "border-amber-500 bg-amber-100"
                                            : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                                    }`}
                                >
                                    <img src={getOpenmojiIconPath(icon.key)} alt={icon.label} className="w-8 h-8" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

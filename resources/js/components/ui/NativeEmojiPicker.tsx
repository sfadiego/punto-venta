import { groupNativeEmojiCatalog, hexToEmoji } from "@/utils/iconAssets";

interface NativeEmojiPickerProps {
    value: string;
    search?: string;
    onSelect: (emoji: string) => void;
}

// Mismo catálogo/UI que OpenmojiPicker, pero renderiza el emoji como texto (fuente nativa del
// sistema operativo) en vez de la imagen SVG vendorizada — ver NON_NATIVE_KEYS en
// utils/iconAssets.ts para las claves que se excluyen por no tener equivalente nativo real.
export const NativeEmojiPicker = ({ value, search = "", onSelect }: NativeEmojiPickerProps) => {
    const groups = groupNativeEmojiCatalog(search);

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
                            const emoji = hexToEmoji(icon.key);
                            if (!emoji) return null;
                            const isSelected = value === emoji;

                            return (
                                <button
                                    key={icon.key}
                                    type="button"
                                    onClick={() => onSelect(emoji)}
                                    title={icon.label}
                                    className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition-colors ${
                                        isSelected
                                            ? "border-amber-500 bg-amber-100"
                                            : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                                    }`}
                                >
                                    {emoji}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

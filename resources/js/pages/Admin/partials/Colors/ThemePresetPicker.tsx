import { Check } from "lucide-react";
import { AppThemeEnum, APP_THEME_LABELS } from "@/enums/AppThemeEnum";
import { BUSINESS_THEME_PRESETS, BusinessThemePreset } from "@/enums/businessThemePresets";

interface ThemePresetPickerProps {
    primaryColor: string;
    sidebarColor: string;
    fontColor: string;
    labelColor: string;
    onApply: (preset: BusinessThemePreset) => void;
}

const isSameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const isActivePreset = (preset: BusinessThemePreset, props: ThemePresetPickerProps) =>
    isSameColor(preset.primary_color, props.primaryColor) &&
    isSameColor(preset.sidebar_color, props.sidebarColor) &&
    isSameColor(preset.font_color, props.fontColor) &&
    isSameColor(preset.label_color, props.labelColor);

export function ThemePresetPicker(props: ThemePresetPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-stone-700">Temas predefinidos</label>
            <p className="text-xs text-stone-400 -mt-1">
                Aplica una paleta lista y ajústala manualmente si lo necesitas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.values(AppThemeEnum).map((theme) => {
                    const preset = BUSINESS_THEME_PRESETS[theme];
                    const active = isActivePreset(preset, props);

                    return (
                        <button
                            key={theme}
                            type="button"
                            onClick={() => props.onApply(preset)}
                            className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                                active ? "border-amber-500" : "border-stone-200"
                            }`}
                        >
                            <div className="h-12 flex">
                                <div className="flex-1" style={{ backgroundColor: preset.sidebar_color }} />
                                <div className="flex-1" style={{ backgroundColor: preset.primary_color }} />
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 bg-white">
                                <span className="text-xs font-medium text-stone-700">{APP_THEME_LABELS[theme]}</span>
                                {active && <Check size={14} className="text-amber-600" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

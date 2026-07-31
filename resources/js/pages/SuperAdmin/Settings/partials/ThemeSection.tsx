import { Check, Palette } from "lucide-react";
import { AppThemeEnum, APP_THEME_LABELS } from "@/enums/AppThemeEnum";
import { AUTH_THEME_STYLES } from "@/enums/authThemeStyles";

interface ThemeSectionProps {
    theme: AppThemeEnum | undefined;
    saving: boolean;
    onSelect: (theme: AppThemeEnum) => void;
}

export const ThemeSection = ({ theme, saving, onSelect }: ThemeSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Palette size={16} className="text-slate-500" />
            </div>
            <div>
                <h2 className="text-sm font-semibold text-slate-900">Tema de la pantalla de login</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Elige la paleta de colores que verán todos los negocios en la pantalla pública de acceso.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(AppThemeEnum).map((option) => {
                const isActive = theme === option;
                const styles = AUTH_THEME_STYLES[option];

                return (
                    <button
                        key={option}
                        type="button"
                        disabled={saving}
                        onClick={() => onSelect(option)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-colors disabled:opacity-50 ${
                            isActive ? "border-indigo-500" : "border-transparent"
                        }`}
                    >
                        <div className={`h-16 ${styles.gradient}`} />
                        <div className="flex items-center justify-between px-3 py-2 bg-white">
                            <span className="text-sm font-medium text-slate-700">{APP_THEME_LABELS[option]}</span>
                            {isActive && <Check size={16} className="text-indigo-600" />}
                        </div>
                    </button>
                );
            })}
        </div>
    </section>
);

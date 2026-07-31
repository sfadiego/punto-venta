import { ArrowRight } from "lucide-react";
import { AppThemeEnum } from "@/enums/AppThemeEnum";
import { AUTH_THEME_STYLES } from "@/enums/authThemeStyles";

interface ClientAccessFormProps {
    slug: string;
    setSlug: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    theme?: AppThemeEnum;
}

export const ClientAccessForm = ({ slug, setSlug, onSubmit, theme = AppThemeEnum.AmberOrange }: ClientAccessFormProps) => {
    const styles = AUTH_THEME_STYLES[theme];

    return (
        <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Accede a tu negocio</h2>
            <p className="text-stone-500 text-sm mb-4">Ingresa el identificador de tu negocio</p>

            <form onSubmit={onSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="mi-negocio"
                    className={`flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm
                        focus:outline-none focus:ring-2 ${styles.focusRing} bg-white`}
                />
                <button
                    type="submit"
                    disabled={!slug.trim()}
                    className={`px-4 py-2.5 ${styles.accentBg} ${styles.accentBgHover} disabled:opacity-40
                        text-white rounded-xl transition-colors`}
                >
                    <ArrowRight size={18} />
                </button>
            </form>
        </div>
    );
};

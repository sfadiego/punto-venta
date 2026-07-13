import { Globe, Loader, Copy, Check } from "lucide-react";
import { useState } from "react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useMenuSection } from "./useMenuSection";

interface MenuSectionProps {
    config: IBusinessConfig | undefined;
}

export const MenuSection = ({ config }: MenuSectionProps) => {
    const { toggle, isSubmitting } = useMenuSection(config);
    const [copied, setCopied] = useState(false);

    const menuUrl = config?.slug
        ? `${window.location.origin}/${config.slug}/menu`
        : null;

    const handleCopy = () => {
        if (!menuUrl) return;
        navigator.clipboard.writeText(menuUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const enabled = !!config?.menu_enabled;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Pedidos en línea</h2>
                <p className="text-xs text-stone-400">
                    Permite a tus clientes ver el menú y hacer pedidos desde un enlace público
                </p>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <Globe size={16} className={enabled ? "text-amber-500" : "text-stone-300"} />
                    <span className="text-sm font-medium text-stone-700">
                        {enabled ? "Pedidos activados" : "Pedidos desactivados"}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={toggle}
                    disabled={isSubmitting || !config}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        enabled ? "bg-amber-500" : "bg-stone-200"
                    }`}
                >
                    {isSubmitting && (
                        <Loader size={10} className="absolute left-1/2 -translate-x-1/2 text-white animate-spin" />
                    )}
                    <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                </button>
            </div>

            {menuUrl && (
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5">
                    <p className="flex-1 text-xs text-stone-500 truncate">{menuUrl}</p>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="shrink-0 text-stone-400 hover:text-amber-500 transition-colors"
                        title="Copiar enlace"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>
            )}
        </div>
    );
};

import { Truck, Loader } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useProvidersSection } from "./useProvidersSection";

interface ProvidersSectionProps {
    config: IBusinessConfig | undefined;
}

export const ProvidersSection = ({ config }: ProvidersSectionProps) => {
    const { toggle, isSubmitting } = useProvidersSection(config);
    const enabled = !!config?.purchases_enabled;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Proveedores</h2>
                <p className="text-xs text-stone-400">
                    Lleva el registro de tus proveedores y las compras que les haces
                </p>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <Truck size={16} className={enabled ? "text-amber-500" : "text-stone-300"} />
                    <span className="text-sm font-medium text-stone-700">
                        {enabled ? "Proveedores activados" : "Proveedores desactivados"}
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
        </div>
    );
};

import { ChevronLeft, Menu, Search } from "lucide-react";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useLayout } from "@/contexts/LayoutContext";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { ScaleReadout } from "./ScaleReadout";

export const QuickSaleHeader = () => {
    const { data: config } = useGetBusinessConfig();
    const { toggleSidebar } = useLayout();
    const {
        search,
        setSearch,
        handleBack,
        isSavingOrder,
        scaleSupported,
        scaleIsPaired,
        isReadingScale,
        stagedWeightKg,
        handleReadScale,
        clearStagedWeight,
    } = useQuickSaleContext();
    const appName = import.meta.env.VITE_APP_NAME;

    return (
        <div className="bg-white border-b border-stone-200 flex items-center gap-3 flex-shrink-0 px-4 py-3.5 lg:px-6 lg:py-4">
            <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu size={20} />
            </button>
            <button
                onClick={handleBack}
                disabled={isSavingOrder}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors disabled:opacity-40 disabled:cursor-wait -ml-1 lg:ml-0"
                aria-label="Volver"
            >
                <ChevronLeft size={20} />
            </button>

            <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-stone-900 truncate text-sm lg:text-base">
                    {config?.business_name ?? appName}
                </h1>
                <p className="hidden lg:block text-stone-400 text-xs mt-0.5">{appName}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <label className="hidden md:flex items-center gap-2 w-80 max-w-[32vw] bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
                    <Search size={16} className="text-stone-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto…"
                        className="w-full bg-transparent outline-none text-sm text-stone-900 placeholder-stone-400"
                    />
                </label>
                <ScaleReadout
                    isSupported={scaleSupported}
                    isPaired={scaleIsPaired}
                    isReading={isReadingScale}
                    stagedWeightKg={stagedWeightKg}
                    onRead={handleReadScale}
                    onClearStaged={clearStagedWeight}
                />
            </div>
        </div>
    );
};

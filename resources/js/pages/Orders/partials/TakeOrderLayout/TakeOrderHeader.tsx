import { ChevronLeft, Lock, Menu, PackagePlus } from "lucide-react";

interface TakeOrderHeaderProps {
    title: string;
    isReadOnly: boolean;
    onBack: () => void;
    onAddExtra: () => void;
    onMenuClick: () => void;
    showAddExtra?: boolean;
}

export const TakeOrderHeader = ({
    title,
    isReadOnly,
    onBack,
    onAddExtra,
    onMenuClick,
    showAddExtra = true,
}: TakeOrderHeaderProps) => (
    <div className="bg-white border-b border-stone-200 flex items-center gap-3 flex-shrink-0 px-4 py-3.5 lg:px-6 lg:py-4">
        <button
            onClick={onMenuClick}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
            aria-label="Abrir menú"
        >
            <Menu size={20} />
        </button>
        <button
            onClick={onBack}
            className="p-1.5 -ml-1 lg:ml-0 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
        >
            <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h1 className="font-semibold text-stone-900 truncate text-sm lg:text-base">
                    {title}
                </h1>
                {isReadOnly && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium shrink-0">
                        <Lock size={10} />
                        Solo lectura
                    </span>
                )}
            </div>
            <p className="hidden lg:block text-stone-400 text-xs mt-0.5">
                {isReadOnly
                    ? "Esta orden ya fue cerrada o cancelada"
                    : "Selecciona los productos del menú"}
            </p>
        </div>
        {/* show_extras: false para negocios tipo Retail — no aplica agregar líneas de extra
            sueltas a una venta de mostrador (ver BusinessTypeEnum::features()). */}
        {!isReadOnly && showAddExtra && (
            <button
                onClick={onAddExtra}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 font-medium text-xs transition-colors border border-violet-200 shrink-0"
            >
                <PackagePlus size={14} />
                <span className="hidden lg:inline">Agregar extra</span>
            </button>
        )}
    </div>
);

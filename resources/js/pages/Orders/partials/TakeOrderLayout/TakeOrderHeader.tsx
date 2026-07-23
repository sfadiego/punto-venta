import { ChevronLeft, Lock, Menu, PackagePlus } from "lucide-react";

interface TakeOrderHeaderProps {
    title: string;
    isReadOnly: boolean;
    onBack: () => void;
    onAddExtra: () => void;
    onMenuClick?: () => void;
    compact?: boolean;
}

export const TakeOrderHeader = ({
    title,
    isReadOnly,
    onBack,
    onAddExtra,
    onMenuClick,
    compact = false,
}: TakeOrderHeaderProps) => (
    <div
        className={`bg-white border-b border-stone-200 flex items-center gap-3 flex-shrink-0 ${
            compact ? "px-4 py-3.5" : "px-6 py-4"
        }`}
    >
        {onMenuClick && (
            <button
                onClick={onMenuClick}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu size={20} />
            </button>
        )}
        <button
            onClick={onBack}
            className={`p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors ${compact ? "-ml-1" : ""}`}
        >
            <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h1 className={`font-semibold text-stone-900 truncate ${compact ? "text-sm" : ""}`}>
                    {title}
                </h1>
                {isReadOnly && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium shrink-0">
                        <Lock size={10} />
                        Solo lectura
                    </span>
                )}
            </div>
            {!compact && (
                <p className="text-stone-400 text-xs mt-0.5">
                    {isReadOnly
                        ? "Esta orden ya fue cerrada o cancelada"
                        : "Selecciona los productos del menú"}
                </p>
            )}
        </div>
        {!isReadOnly && (
            <button
                onClick={onAddExtra}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 font-medium text-xs transition-colors border border-violet-200 shrink-0"
            >
                <PackagePlus size={14} />
                {!compact && <span>Agregar extra</span>}
            </button>
        )}
    </div>
);

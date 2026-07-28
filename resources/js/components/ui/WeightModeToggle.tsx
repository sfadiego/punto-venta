import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";

interface WeightModeToggleProps {
    mode: WeightInputModeEnum;
    weightLabel: string;
    onSelectWeight: () => void;
    onSelectPrice: () => void;
    color?: "stone" | "amber";
    size?: "sm" | "md";
}

export const WeightModeToggle = ({
    mode,
    weightLabel,
    onSelectWeight,
    onSelectPrice,
    color = "stone",
    size = "md",
}: WeightModeToggleProps) => {
    // "sm" crece el área táctil en móvil/tablet y vuelve a compacto en desktop
    // (lg:) — es el único tamaño usado en contextos táctiles (carrito de venta).
    const padding = size === "sm" ? "px-3 py-2 lg:px-1.5 lg:py-0.5" : "px-2.5 py-0.5";
    const rounded = size === "sm" ? "rounded" : "rounded-md";
    const textSize = size === "sm" ? "text-xs lg:text-[10px]" : "text-[10px]";
    const activeClass = color === "amber" ? "bg-amber-500 text-white" : "bg-stone-800 text-white";
    const inactiveClass =
        color === "amber"
            ? "bg-white text-stone-400 hover:bg-stone-50"
            : "text-stone-400 hover:text-stone-600";
    const divider = color === "amber" ? "border-l border-stone-200" : "";

    return (
        <div className={`flex ${rounded} overflow-hidden border border-stone-200 ${textSize} font-semibold`}>
            <button
                type="button"
                onClick={onSelectWeight}
                className={`${padding} transition-colors ${
                    mode === WeightInputModeEnum.Weight ? activeClass : inactiveClass
                }`}
            >
                {weightLabel}
            </button>
            <button
                type="button"
                onClick={onSelectPrice}
                className={`${padding} ${divider} transition-colors ${
                    mode === WeightInputModeEnum.Price ? activeClass : inactiveClass
                }`}
            >
                $
            </button>
        </div>
    );
};

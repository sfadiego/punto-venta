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
    const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-0.5";
    const rounded = size === "sm" ? "rounded" : "rounded-md";
    const activeClass = color === "amber" ? "bg-amber-500 text-white" : "bg-stone-800 text-white";
    const inactiveClass =
        color === "amber"
            ? "bg-white text-stone-400 hover:bg-stone-50"
            : "text-stone-400 hover:text-stone-600";
    const divider = color === "amber" ? "border-l border-stone-200" : "";

    return (
        <div className={`flex ${rounded} overflow-hidden border border-stone-200 text-[10px] font-semibold`}>
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

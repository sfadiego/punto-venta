interface ShareBarProps {
    percent: number;
}

// Cuánto pesa un cliente de la cartera por cobrar: barra proporcional y el porcentaje. Usa <progress>
// (el ancho sale de `value`) en vez de un style en línea, que CLAUDE.md no permite.
export const ShareBar = ({ percent }: ShareBarProps) => (
    <div className="flex items-center gap-2 min-w-[110px]">
        <progress
            value={Math.min(percent, 100)}
            max={100}
            aria-label={`${percent}% de la cartera`}
            className="h-2 flex-1 appearance-none overflow-hidden rounded-full bg-stone-100 [&::-moz-progress-bar]:bg-red-400 [&::-webkit-progress-bar]:bg-stone-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-red-400"
        />
        <span className="text-xs text-stone-500 tabular-nums w-10 text-right">{percent}%</span>
    </div>
);

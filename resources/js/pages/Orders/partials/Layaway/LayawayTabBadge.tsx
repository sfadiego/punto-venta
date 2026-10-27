interface LayawayTabBadgeProps {
    count: number;
    overdueCount: number;
}

// Contador discreto de la pestaña "Apartados": neutro, y en rojo cuando hay apartados vencidos.
export const LayawayTabBadge = ({ count, overdueCount }: LayawayTabBadgeProps) => {
    const hasOverdue = overdueCount > 0;

    return (
        <span
            title={hasOverdue ? `${overdueCount} ${overdueCount === 1 ? "vencido" : "vencidos"}` : undefined}
            className={`min-w-[18px] px-1.5 rounded-full text-[11px] font-semibold text-center tabular-nums ${
                hasOverdue ? "bg-red-100 text-red-600" : "bg-stone-200 text-stone-600"
            }`}
        >
            {count}
        </span>
    );
};

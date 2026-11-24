interface ICashStatusBadgeProps {
    /** Hora de apertura ya formateada; si no hay, solo se indica que está abierta. */
    openedAt: string | null;
}

export const CashStatusBadge = ({ openedAt }: ICashStatusBadgeProps) => (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1 mt-2">
        <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Caja abierta{openedAt && ` desde las ${openedAt}`}
    </span>
);

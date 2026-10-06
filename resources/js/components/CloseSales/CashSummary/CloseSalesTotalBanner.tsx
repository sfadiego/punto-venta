import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesTotalBannerProps {
    total: number;
    /** false en negocios sin servicio a domicilio (ej. retail) — el desglose no los menciona. */
    showDelivery?: boolean;
}

export const CloseSalesTotalBanner = ({ total, showDelivery = true }: CloseSalesTotalBannerProps) => (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 mb-6 flex items-center justify-between gap-4">
        <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Total esperado en caja</p>
            <p className="text-xs text-amber-500 mt-0.5">{showDelivery
                    ? "Efectivo inicial + ventas − gastos y domicilios pagados en efectivo"
                    : "Efectivo inicial + ventas − gastos pagados en efectivo"}</p>
        </div>
        <p className="text-3xl font-bold text-amber-700 tabular-nums shrink-0">
            {formatCurrency(total)}
        </p>
    </div>
);

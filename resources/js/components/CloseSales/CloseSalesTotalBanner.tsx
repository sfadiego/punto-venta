import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesTotalBannerProps {
    total: number;
}

export const CloseSalesTotalBanner = ({ total }: CloseSalesTotalBannerProps) => (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 mb-6 flex items-center justify-between gap-4">
        <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Total en caja</p>
            <p className="text-xs text-amber-500 mt-0.5">Efectivo en caja + transferencias</p>
        </div>
        <p className="text-3xl font-bold text-amber-700 tabular-nums shrink-0">
            {formatCurrency(total)}
        </p>
    </div>
);

import { Trophy } from "lucide-react";
import { useBestSellerWidget } from "./useBestSellerWidget";

interface Props {
    sistemaId: number | null;
}

export default function BestSellerWidget({ sistemaId }: Props) {
    const { top, isLoading } = useBestSellerWidget(sistemaId);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                    <Trophy size={16} className="text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-stone-700">Más vendido de la sesión</p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-stone-100 rounded animate-pulse" />
                </div>
            ) : top ? (
                <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-stone-900">{top.product}</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                        {top.total} {top.unidad_medida === "unidad"
                            ? (top.total === 1 ? "vendido" : "vendidos")
                            : top.unidad_medida}
                    </span>
                </div>
            ) : (
                <p className="text-sm text-stone-400 italic">Sin ventas registradas hoy</p>
            )}
        </div>
    );
}

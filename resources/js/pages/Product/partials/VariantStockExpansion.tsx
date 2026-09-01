import { Package } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { formatMoney } from "@/utils/formatCurrency";
import { isVariantLowStock } from "@/utils/stock";

interface VariantStockExpansionProps {
    product: IProduct;
}

export const VariantStockExpansion = ({ product }: VariantStockExpansionProps) => {
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);

    return (
        <div>
            {activeVariants.map((v) => (
                <div key={v.id} className="flex items-center border-t border-stone-100 bg-stone-50">
                    <div className="w-[52px] shrink-0 px-4 py-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
                            <Package size={16} className="text-stone-400" />
                        </div>
                    </div>
                    <div className="w-[280px] shrink-0 px-4 py-2 min-w-0">
                        <span className="font-medium text-stone-700 text-sm">{v.nombre}</span>
                    </div>
                    <div className="w-[160px] shrink-0 px-4 py-2 min-w-0">
                        <span className="text-stone-400 text-sm">{product.category?.nombre ?? "—"}</span>
                    </div>
                    <div className="w-[140px] shrink-0 px-4 py-2 min-w-0">
                        <span className="font-semibold text-stone-900 tabular-nums text-sm">
                            ${formatMoney(v.precio)}
                            <span className="ml-1 font-normal text-stone-400">/{UNIDAD_LABELS[product.unidad_medida]}</span>
                        </span>
                    </div>
                    <div className="w-[120px] shrink-0 px-4 py-2 min-w-0">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Activo</span>
                    </div>
                    <div className="w-[100px] shrink-0 px-4 py-2 min-w-0">
                        {product.manage_stock ? (
                            <span
                                className={`text-sm tabular-nums ${isVariantLowStock(v) ? "text-red-600 font-semibold" : "text-stone-700"}`}
                            >
                                {trimDecimalZeros(v.stock ?? 0)}
                            </span>
                        ) : (
                            <span className="text-sm text-stone-400">—</span>
                        )}
                    </div>
                    <div className="w-[150px] shrink-0 px-4 py-2" />
                </div>
            ))}
        </div>
    );
};

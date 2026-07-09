import { Search, Loader, XCircle } from "lucide-react";
import { ICategory } from "@/models/ICategory";
import { IProduct } from "@/models/IProduct";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";

interface NewSaleProductPanelProps {
    search: string;
    setSearch: (v: string) => void;
    nombrePedido: string;
    setNombrePedido: (v: string) => void;
    handleNombreBlur: () => void;
    categories: ICategory[];
    selectedCategory: number | null;
    setSelectedCategory: (id: number | null) => void;
    products: IProduct[];
    productsLoading: boolean;
    isCreatingOrder: boolean;
    onAddProduct: (product: IProduct) => void;
}

export const NewSaleProductPanel = ({
    search, setSearch,
    nombrePedido, setNombrePedido, handleNombreBlur,
    categories, selectedCategory, setSelectedCategory,
    products, productsLoading,
    isCreatingOrder, onAddProduct,
}: NewSaleProductPanelProps) => (
    <div className="flex flex-col flex-1 border-r border-stone-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 pt-4 pb-2 shrink-0 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full pl-8 pr-8 py-2 border border-stone-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                        >
                            <XCircle size={14} />
                        </button>
                    )}
                </div>
                <input
                    type="text"
                    value={nombrePedido}
                    onChange={(e) => setNombrePedido(e.target.value)}
                    onBlur={handleNombreBlur}
                    placeholder="Referencia (opc.)"
                    className="w-full sm:w-44 px-3 py-2 border border-stone-200 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50 placeholder:text-stone-300"
                />
            </div>

            {categories.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedCategory === null
                                ? "bg-amber-500 text-white"
                                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id ?? null)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                selectedCategory === cat.id
                                    ? "bg-amber-500 text-white"
                                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                            }`}
                        >
                            {cat.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Product grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            {productsLoading ? (
                <div className="flex justify-center py-8">
                    <Loader size={18} className="animate-spin text-stone-400" />
                </div>
            ) : products.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-8">Sin resultados</p>
            ) : (
                <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-2">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => onAddProduct(product)}
                            disabled={isCreatingOrder}
                            className="
                                flex items-center justify-between gap-3 px-3 py-2.5
                                border-b border-stone-100 last:border-0 text-left
                                hover:bg-amber-50 active:bg-amber-100 transition-colors
                                disabled:opacity-60 disabled:cursor-wait group
                                sm:flex-col sm:items-start sm:justify-start sm:p-3
                                sm:rounded-xl sm:border sm:border-stone-100 sm:bg-stone-50
                                sm:hover:border-amber-300 sm:last:border sm:mb-0
                            "
                        >
                            <p className="flex-1 text-sm font-medium text-stone-800 leading-tight truncate group-hover:text-amber-700
                                sm:font-semibold sm:line-clamp-2 sm:whitespace-normal">
                                {product.nombre}
                            </p>
                            <div className="flex items-center gap-2 shrink-0 sm:w-full sm:justify-between sm:mt-auto sm:pt-2">
                                <span className="text-xs text-stone-400 hidden sm:inline">
                                    {UNIDAD_LABELS[product.unidad_medida]}
                                </span>
                                <span className="text-sm font-bold text-amber-600">
                                    ${product.precio.toFixed(2)}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
);

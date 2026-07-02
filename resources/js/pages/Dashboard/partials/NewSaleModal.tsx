import { X, Search, Trash2, Loader, ShoppingCart, Eraser, XCircle, Bike } from "lucide-react";
import { useNewSaleModal } from "./useNewSaleModal";
import { IProduct } from "@/models/IProduct";
import { UNIDAD_LABELS, UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

interface NewSaleModalProps {
    onClose: () => void;
}

const isPeso = (p: IProduct) =>
    p.unidad_medida === UnidadMedidaEnum.Kg || p.unidad_medida === UnidadMedidaEnum.Gr;

export const NewSaleModal = ({ onClose }: NewSaleModalProps) => {
    const {
        search, setSearch,
        nombrePedido, setNombrePedido,
        domicilioActivo, toggleDomicilio,
        costoDomicilio, setCostoDomicilio,
        orderDeliveryPaidBy, setOrderDeliveryPaidBy,
        categories, selectedCategory, setSelectedCategory,
        products, productsLoading,
        cart, total,
        sellByWeight,
        addToCart, updateCantidad, removeFromCart, clearCart,
        handleSubmit, isPending,
    } = useNewSaleModal(onClose);

    const domicilio = parseFloat(costoDomicilio) || 0;
    const customerPays = orderDeliveryPaidBy === 'customer';
    const totalFinal = domicilioActivo && domicilio > 0
        ? (customerPays ? total + domicilio : total - domicilio)
        : total;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-100">
                            <ShoppingCart size={16} className="text-amber-600" />
                        </div>
                        <h2 className="text-base font-semibold text-stone-900">Nueva venta</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

                    {/* Panel izquierdo — productos */}
                    <div className="flex flex-col flex-1 border-r border-stone-100 overflow-hidden">
                        <div className="px-4 pt-4 pb-2 shrink-0 space-y-2">
                            {/* Buscador + nombre cliente */}
                            <div className="flex gap-2">
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
                                    placeholder="Mesa / cliente (opc.)"
                                    className="w-44 px-3 py-2 border border-stone-200 rounded-xl text-sm
                                        focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50 placeholder:text-stone-300"
                                />
                            </div>

                            {/* Pills de categoría */}
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

                        <div className="overflow-y-auto px-4 pb-4 h-[60vh]">
                            {productsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader size={18} className="animate-spin text-stone-400" />
                                </div>
                            ) : products.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-8">Sin resultados</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {products.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="flex flex-col items-start p-3 rounded-xl border border-stone-100 bg-stone-50
                                                hover:bg-amber-50 hover:border-amber-300 transition-colors text-left group"
                                        >
                                            <p className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2 group-hover:text-amber-700">
                                                {product.nombre}
                                            </p>
                                            <p className="mt-1.5 text-xs text-stone-400">
                                                {UNIDAD_LABELS[product.unidad_medida]}
                                            </p>
                                            <p className="mt-auto pt-2 text-sm font-bold text-amber-600">
                                                ${product.precio.toFixed(2)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel derecho — carrito */}
                    <div className="flex flex-col w-full sm:w-80 shrink-0">
                        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                                Carrito
                            </p>
                            {cart.length > 0 && (
                                <button
                                    onClick={clearCart}
                                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 transition-colors"
                                >
                                    <Eraser size={11} />
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-2">
                            {cart.length === 0 ? (
                                <p className="text-xs text-stone-400 text-center pt-8">
                                    Sin productos
                                </p>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.product.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold text-stone-900 leading-tight">
                                                {item.product.nombre}
                                            </p>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="text-stone-300 hover:text-red-400 transition-colors shrink-0"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={item.cantidad}
                                                min={isPeso(item.product) ? 0.001 : 1}
                                                step={isPeso(item.product) ? 0.1 : 1}
                                                onChange={(e) => updateCantidad(item.product.id, parseFloat(e.target.value) || 0)}
                                                className="w-20 px-2 py-1 border border-stone-200 rounded-lg text-xs text-center
                                                    focus:outline-none focus:ring-2 focus:ring-amber-400"
                                            />
                                            <span className="text-xs text-stone-400">
                                                {UNIDAD_LABELS[item.product.unidad_medida]}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-amber-600 text-right">
                                            ${(item.product.precio * item.cantidad).toFixed(2)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Total + Cobrar */}
                        <div className="px-4 py-4 border-t border-stone-100 shrink-0 space-y-2">
                            {/* Checkbox envío a domicilio — solo negocios de venta por peso */}
                            {sellByWeight && (
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={domicilioActivo}
                                        onChange={(e) => toggleDomicilio(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded accent-amber-500"
                                    />
                                    <span className="flex items-center gap-1 text-xs text-stone-500">
                                        <Bike size={12} className="text-stone-400" />
                                        Envío a domicilio
                                    </span>
                                </label>
                            )}
                            {/* Costo + quién paga — por orden */}
                            {sellByWeight && domicilioActivo && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-stone-500 shrink-0">Costo $</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            value={costoDomicilio}
                                            onChange={(e) => setCostoDomicilio(e.target.value)}
                                            placeholder="0.00"
                                            className="flex-1 px-2 py-1 border border-amber-300 rounded-lg text-xs
                                                text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                    </div>
                                    {/* Toggle quién paga este envío */}
                                    <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setOrderDeliveryPaidBy('customer')}
                                            className={`flex-1 py-1.5 font-medium transition-colors ${
                                                customerPays
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-white text-stone-500 hover:bg-stone-50'
                                            }`}
                                        >
                                            Cliente paga
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOrderDeliveryPaidBy('business')}
                                            className={`flex-1 py-1.5 font-medium transition-colors border-l border-stone-200 ${
                                                !customerPays
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-white text-stone-500 hover:bg-stone-50'
                                            }`}
                                        >
                                            Negocio paga
                                        </button>
                                    </div>
                                </>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-stone-400">Subtotal</span>
                                <span className="text-sm text-stone-600">${total.toFixed(2)}</span>
                            </div>
                            {sellByWeight && domicilioActivo && domicilio > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-stone-400">
                                        {customerPays ? '+ Domicilio' : '- Domicilio'}
                                    </span>
                                    <span className={`text-sm ${customerPays ? 'text-amber-600' : 'text-red-500'}`}>
                                        {customerPays ? '+' : '-'}${domicilio.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                                <span className="text-sm font-medium text-stone-600">
                                    {sellByWeight && domicilioActivo && domicilio > 0 && !customerPays
                                        ? 'Ingreso neto'
                                        : 'Total'}
                                </span>
                                <span className="text-lg font-bold text-stone-900">
                                    ${totalFinal.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || isPending}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                    bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                                    text-white text-sm font-semibold transition-colors"
                            >
                                {isPending
                                    ? <Loader size={15} className="animate-spin" />
                                    : <ShoppingCart size={15} />
                                }
                                Cobrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

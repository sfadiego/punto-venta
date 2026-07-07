import { ShoppingCart } from "lucide-react";

export const CartEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-stone-400 py-12">
        <ShoppingCart size={38} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">El pedido está vacío</p>
        <p className="text-xs mt-1 text-stone-400">Selecciona productos del menú</p>
    </div>
);

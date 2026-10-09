import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/form/Input";
import { IOrderSummary } from "@/models/IOrder";
import { formatOrderDateTime } from "@/utils/dateUtils";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface OrderAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: IOrderSummary[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSelect: (order: IOrderSummary) => void;
}

// Combobox de un solo input: escribir busca entre TODAS las órdenes cerradas del tenant (sin
// importar sesión/fecha, ver useListClosedOrders) y las coincidencias aparecen desplegadas
// debajo. Mismo patrón que ProductAutocomplete.
export const OrderAutocomplete = ({ value, onChange, suggestions, isOpen, setIsOpen, onSelect }: OrderAutocompleteProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [setIsOpen]);

    return (
        <div ref={containerRef} className="relative">
            <Input
                name="order_search"
                label="Orden *"
                placeholder="Busca por nombre, cliente o folio..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />

            {isOpen && (
                // Sin position:absolute — el modal que lo contiene tiene overflow-hidden por
                // las esquinas redondeadas, así que el desplegable empuja el contenido de
                // abajo en vez de flotar encima (si no, quedaría recortado o saldría de la
                // tarjeta del modal).
                <ul className="mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {suggestions.length === 0 && (
                        <li className="px-3 py-2.5 text-xs text-stone-400 text-center">Sin órdenes cerradas que coincidan</li>
                    )}
                    {suggestions.map((order) => (
                        <li key={order.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(order)}
                                className="w-full text-left px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">#{order.id} · {order.nombre_pedido}</span>
                                    <span className="text-stone-500 tabular-nums shrink-0">{formatCurrencyTrimmed(order.total)}</span>
                                </div>
                                <div className="text-xs text-stone-400 mt-0.5">
                                    {order.customer?.name ? `${order.customer.name} · ` : ""}
                                    {formatOrderDateTime(order.created_at)}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

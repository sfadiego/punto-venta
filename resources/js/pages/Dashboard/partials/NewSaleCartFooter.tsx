import { Bike, DollarSign } from "lucide-react";

interface NewSaleCartFooterProps {
    sellByWeight: boolean;
    domicilioActivo: boolean;
    toggleDomicilio: (checked: boolean) => void;
    costoDomicilio: string;
    setCostoDomicilio: (v: string) => void;
    orderDeliveryPaidBy: "customer" | "business";
    setOrderDeliveryPaidBy: (v: "customer" | "business") => void;
    customerPays: boolean;
    domicilio: number;
    total: number;
    totalFinal: number;
    hasItems: boolean;
    onPay: () => void;
}

export const NewSaleCartFooter = ({
    sellByWeight,
    domicilioActivo, toggleDomicilio,
    costoDomicilio, setCostoDomicilio,
    orderDeliveryPaidBy, setOrderDeliveryPaidBy,
    customerPays, domicilio,
    total, totalFinal,
    hasItems, onPay,
}: NewSaleCartFooterProps) => (
    <div className="px-4 py-4 border-t border-stone-100 shrink-0 space-y-2">
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
                <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
                    <button
                        type="button"
                        onClick={() => setOrderDeliveryPaidBy("customer")}
                        className={`flex-1 py-1.5 font-medium transition-colors ${
                            customerPays ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
                        }`}
                    >
                        Cliente paga
                    </button>
                    <button
                        type="button"
                        onClick={() => setOrderDeliveryPaidBy("business")}
                        className={`flex-1 py-1.5 font-medium transition-colors border-l border-stone-200 ${
                            !customerPays ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
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
                    {customerPays ? "+ Domicilio" : "- Domicilio"}
                </span>
                <span className={`text-sm ${customerPays ? "text-amber-600" : "text-red-500"}`}>
                    {customerPays ? "+" : "-"}${domicilio.toFixed(2)}
                </span>
            </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
            <span className="text-sm font-medium text-stone-600">
                {sellByWeight && domicilioActivo && domicilio > 0 && !customerPays
                    ? "Ingreso neto"
                    : "Total"}
            </span>
            <span className="text-lg font-bold text-stone-900">
                ${totalFinal.toFixed(2)}
            </span>
        </div>

        <button
            onClick={onPay}
            disabled={!hasItems}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm font-semibold transition-colors"
        >
            <DollarSign size={15} />
            Cobrar
        </button>
    </div>
);

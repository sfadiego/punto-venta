import { Bike } from "lucide-react";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";

interface CartDeliveryFieldsProps {
    domicilioActivo: boolean;
    toggleDomicilio: (checked: boolean) => void;
    costoDomicilio: string;
    setCostoDomicilio: (v: string) => void;
    onCostoDomicilioBlur: () => void;
    setOrderDeliveryPaidBy: (v: DeliveryPaidByEnum) => void;
    domicilio: number;
    customerPays: boolean;
    isReadOnly?: boolean;
}

export const CartDeliveryFields = ({
    domicilioActivo,
    toggleDomicilio,
    costoDomicilio,
    setCostoDomicilio,
    onCostoDomicilioBlur,
    setOrderDeliveryPaidBy,
    domicilio,
    customerPays,
    isReadOnly = false,
}: CartDeliveryFieldsProps) => (
    <>
        {!isReadOnly && (
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
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

        {domicilioActivo && (
            <>
                {!isReadOnly && (
                    <>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-stone-500 shrink-0">Costo $</label>
                            <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={costoDomicilio}
                                onChange={(e) => setCostoDomicilio(e.target.value)}
                                onBlur={onCostoDomicilioBlur}
                                placeholder="0.00"
                                className="flex-1 px-2 py-1 border border-amber-300 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
                            <button
                                type="button"
                                onClick={() => setOrderDeliveryPaidBy(DeliveryPaidByEnum.Customer)}
                                className={`flex-1 py-1.5 font-medium transition-colors ${
                                    customerPays ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
                                }`}
                            >
                                Cliente paga
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrderDeliveryPaidBy(DeliveryPaidByEnum.Business)}
                                className={`flex-1 py-1.5 font-medium transition-colors border-l border-stone-200 ${
                                    !customerPays ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
                                }`}
                            >
                                Negocio paga
                            </button>
                        </div>
                    </>
                )}

                {domicilio > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">Domicilio</span>
                        <span className={`tabular-nums ${customerPays ? "text-amber-600" : "text-stone-400"}`}>
                            {customerPays ? `+$${domicilio.toFixed(2)}` : `-$${domicilio.toFixed(2)}`}
                        </span>
                    </div>
                )}
            </>
        )}
    </>
);

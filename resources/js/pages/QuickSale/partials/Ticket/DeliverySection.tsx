import { Bike } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { sanitizePositiveNumberInput } from "@/utils/sanitizePositiveNumberInput";
import { useQuickSaleContext } from "../../QuickSaleContext";

export const DeliverySection = () => {
    const {
        domicilioActivo,
        toggleDelivery,
        costoDomicilio,
        setCostoDomicilio,
        handleCostoDomicilioBlur,
        deliveryPaidBy,
        setDeliveryPaidBy,
    } = useQuickSaleContext();

    return (
        <div className="flex items-center flex-wrap gap-2 py-2">
            <button type="button" onClick={toggleDelivery} className="flex items-center gap-2 shrink-0">
                <Bike size={15} className="text-stone-400" style={domicilioActivo ? { color: "var(--color-primary)" } : undefined} />
                <span className="text-sm font-medium text-stone-700">Domicilio</span>
                <span
                    className={`relative w-8 h-4 shrink-0 rounded-full transition-colors ${domicilioActivo ? "" : "bg-stone-300"}`}
                    style={domicilioActivo ? { backgroundColor: "var(--color-primary)" } : undefined}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                            domicilioActivo ? "translate-x-4" : ""
                        }`}
                    />
                </span>
            </button>

            {domicilioActivo && (
                <>
                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg pl-2 pr-1 py-0.5">
                        <span className="text-xs font-bold text-stone-400">$</span>
                        <Input
                            name="costoDomicilio"
                            inputType="number"
                            placeholder="0"
                            min={0}
                            value={costoDomicilio}
                            onChange={(e) => setCostoDomicilio(sanitizePositiveNumberInput(e.target.value))}
                            onBlur={handleCostoDomicilioBlur}
                            inputStyle="none"
                            className="!w-16 !px-0 !py-1 !border-0 !rounded-none !bg-transparent !text-xs !font-bold focus:!ring-0 tabular-nums"
                        />
                    </div>

                    <div className="flex gap-0.5 bg-stone-100 border border-stone-200 rounded-full p-0.5">
                        <button
                            type="button"
                            onClick={() => setDeliveryPaidBy(DeliveryPaidByEnum.Customer)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                deliveryPaidBy === DeliveryPaidByEnum.Customer ? "text-white" : "text-stone-500"
                            }`}
                            style={deliveryPaidBy === DeliveryPaidByEnum.Customer ? { backgroundColor: "var(--color-primary)" } : undefined}
                        >
                            Cliente
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeliveryPaidBy(DeliveryPaidByEnum.Business)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                deliveryPaidBy === DeliveryPaidByEnum.Business ? "text-white" : "text-stone-500"
                            }`}
                            style={deliveryPaidBy === DeliveryPaidByEnum.Business ? { backgroundColor: "var(--color-primary)" } : undefined}
                        >
                            Negocio
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

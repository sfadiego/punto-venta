import { Input } from "@/components/ui/form/Input";
import { PayTransferAlert } from "@/components/orders/PayModal/PayTransferAlert";

interface CashPaymentSectionProps {
    isCashMethod: boolean;
    totalFinal: number;
    cash: string;
    setCash: (v: string) => void;
    cashNum: number;
    change: number;
}

export const CashPaymentSection = ({
    isCashMethod, totalFinal, cash, setCash, cashNum, change,
}: CashPaymentSectionProps) => (
    <>
        <PayTransferAlert isCash={isCashMethod} />

        {/* Efectivo + cambio — fade in/out */}
        <div className={`fade-collapse space-y-3 ${isCashMethod ? "is-visible" : "is-hidden"}`}>
            <p className="text-sm font-medium text-stone-700 mb-1.5 text-left">Efectivo recibido</p>
            <Input
                name="cash"
                inputStyle="outlined"
                inputType="number"
                placeholder="0.00"
                min={0}
                max={Math.ceil(totalFinal * 10)}
                step={0.5}
                value={cash}
                onChange={(e) => {
                    const val = e.target.value;
                    const num = parseFloat(val);
                    const max = Math.ceil(totalFinal * 10);
                    if (val === "" || (!isNaN(num) && num <= max)) setCash(val);
                }}
            />

            {cashNum > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-xl transition-colors duration-200 ${
                    change >= 0 ? "bg-emerald-50" : "bg-red-50"
                }`}>
                    <span className="text-sm text-stone-500">Cambio</span>
                    <span className={`text-lg font-bold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        ${change.toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    </>
);

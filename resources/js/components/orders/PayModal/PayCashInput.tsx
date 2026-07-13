import { Input } from "@/components/ui/form/Input";

interface PayCashInputProps {
    isCash: boolean;
    cash: string;
    setCash: (v: string) => void;
    change: number;
    max: number;
}

export const PayCashInput = ({ isCash, cash, setCash, change, max }: PayCashInputProps) => (
    <div className={`fade-collapse space-y-4 ${isCash ? "is-visible" : "is-hidden"}`}>
        <Input
            name="cash"
            label="Efectivo recibido"
            inputType="number"
            placeholder="0.00"
            min={0}
            max={max}
            step={0.5}
            value={cash}
            onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                if (val === "" || (!isNaN(num) && num <= max)) setCash(val);
            }}
        />

        <div
            className={`rounded-xl p-4 flex items-center justify-between transition-colors duration-200 ${
                change >= 0 && cash !== ""
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-stone-50 border border-stone-100"
            }`}
        >
            <span className="text-sm font-medium text-stone-600">Cambio</span>
            <span
                className={`text-xl font-bold tabular-nums transition-colors duration-200 ${
                    change >= 0 && cash !== "" ? "text-emerald-700" : "text-stone-400"
                }`}
            >
                ${change >= 0 ? change.toFixed(2) : "0.00"}
            </span>
        </div>
    </div>
);

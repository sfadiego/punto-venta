import { Input } from "@/components/ui/form/Input";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { calcDepositFromPercent, getLayawayPercentOptions } from "@/utils/layawayCalc";
import { LayawayForm, LayawayPay } from "./useLayawayPay";

interface LayawayDepositSelectorProps {
    layaway: LayawayPay;
}

export const LayawayDepositSelector = ({ layaway }: LayawayDepositSelectorProps) => {
    const { formik, total, minPercent, setAmount } = layaway;
    const currentAmount = Number(formik.values.amount);

    return (
        <div className="space-y-2">
            <p className="text-xs text-stone-500 text-left">Anticipo</p>
            <div className="flex flex-wrap gap-2">
                {getLayawayPercentOptions(minPercent).map((percent) => {
                    const amount = calcDepositFromPercent(total, percent);
                    const isActive = currentAmount === amount;
                    return (
                        <button
                            key={percent}
                            type="button"
                            onClick={() => setAmount(String(amount))}
                            className={`px-3 py-2 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
                                isActive
                                    ? "bg-amber-50 border-amber-500 text-amber-800 font-semibold"
                                    : "bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50"
                            }`}
                        >
                            {percent}% · {formatCurrencyTrimmed(amount)}
                        </button>
                    );
                })}
            </div>
            <Input<LayawayForm>
                name="amount"
                label="Monto fijo"
                inputType="number"
                inputMode="decimal"
                placeholder="0.00"
                min={0}
                step={0.01}
                icon="$"
                formik={formik}
            />
        </div>
    );
};

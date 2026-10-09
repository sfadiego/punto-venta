import { Input } from "@/components/ui/form/Input";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { calcDepositFromPercent, getRetentionPercentOptions } from "@/utils/layawayCalc";
import { LayawayCancelForm, LayawayCancel } from "./useLayawayCancelModal";

interface LayawayRetentionSelectorProps {
    cancel: LayawayCancel;
}

// Cuánto de lo abonado se queda el negocio: atajos (reembolsar todo, un porcentaje, retener todo)
// más un monto libre. 0 = reembolso total.
export const LayawayRetentionSelector = ({ cancel }: LayawayRetentionSelectorProps) => {
    const { formik, paid, suggestedPercent, retained, setRetained } = cancel;

    const chipClass = (active: boolean) =>
        `px-3 py-2 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
            active
                ? "bg-amber-50 border-amber-500 text-amber-800 font-semibold"
                : "bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50"
        }`;

    return (
        <div className="space-y-2">
            <p className="text-xs text-stone-500 text-left">¿Cuánto retiene el negocio?</p>
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setRetained(0)} className={chipClass(retained === 0)}>
                    Reembolsar todo
                </button>
                {getRetentionPercentOptions(suggestedPercent).map((percent) => {
                    const amount = calcDepositFromPercent(paid, percent);
                    return (
                        <button key={percent} type="button" onClick={() => setRetained(amount)} className={chipClass(retained === amount && amount > 0 && amount < paid)}>
                            {percent}% · {formatCurrencyTrimmed(amount)}
                        </button>
                    );
                })}
                <button type="button" onClick={() => setRetained(paid)} className={chipClass(retained === paid && paid > 0)}>
                    Retener todo
                </button>
            </div>
            <Input<LayawayCancelForm>
                name="retained_amount"
                label="o monto a retener"
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

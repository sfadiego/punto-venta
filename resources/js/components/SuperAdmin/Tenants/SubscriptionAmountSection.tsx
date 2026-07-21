import { Banknote } from "lucide-react";
import { Input } from "@/components/ui/form/Input";

interface SubscriptionAmountSectionProps {
    amount: number | null | undefined;
    onAmountChange: (value: number | null) => void;
}

export const SubscriptionAmountSection = ({ amount, onAmountChange }: SubscriptionAmountSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Banknote size={17} className="text-emerald-600" />
            </div>
            <div>
                <h2 className="text-sm font-semibold text-slate-900">Monto de la suscripción</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Lo que este cliente debe depositar por su plan actual. Se muestra en su panel.
                </p>
            </div>
        </div>

        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Monto <span className="text-slate-400 font-normal">(opcional)</span></label>
            <Input
                name="subscription_amount"
                inputType="number"
                min={0}
                step={0.01}
                value={amount !== null && amount !== undefined ? String(amount) : ""}
                placeholder="0.00"
                onChange={(e) => {
                    const val = e.target.value;
                    onAmountChange(val === "" ? null : parseFloat(val));
                }}
            />
        </div>
    </section>
);

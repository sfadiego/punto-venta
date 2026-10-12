import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { SelectSubscriptionPlan } from "@/components/SuperAdmin/Subscriptions/SelectSubscriptionPlan";
import { computeExpiresAt } from "@/utils/dateUtils";
import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { TenantFormik, TenantFormValues } from "@/pages/SuperAdmin/Tenants/useTenantForm";

interface TenantSubscriptionStartSectionProps {
    formik: TenantFormik;
}

export const TenantSubscriptionStartSection = ({ formik }: TenantSubscriptionStartSectionProps) => {
    const isLifetime = formik.values.plan === SubscriptionPlanEnum.Lifetime;
    const expiresAt = computeExpiresAt(formik.values.plan, formik.values.starts_at);

    return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Suscripción inicial
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectSubscriptionPlan<TenantFormValues> name="plan" label="Plan / periodo" formik={formik} />
            <div>
                <Input name="starts_at" label="Fecha de inicio" inputType="date" formik={formik} />
                {isLifetime && (
                    <p className="flex items-center gap-1.5 text-xs text-indigo-500 mt-1.5">
                        <CalendarDays size={12} />
                        Sin fecha de vencimiento
                    </p>
                )}
                {expiresAt && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <CalendarDays size={12} />
                        Vence el {expiresAt}
                    </p>
                )}
            </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">Es periodo de prueba</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    El cliente usa el plan elegido sin costo. Después podrás registrar su pago real.
                </p>
            </div>
            <button
                type="button"
                onClick={() => formik.setFieldValue("is_trial", !formik.values.is_trial)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    formik.values.is_trial ? "bg-indigo-600" : "bg-slate-200"
                }`}
                role="switch"
                aria-checked={formik.values.is_trial}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        formik.values.is_trial ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
        </div>

        {!formik.values.is_trial && (
            <Input name="amount" label="Monto cobrado" inputType="number" min={0} step={0.01} placeholder="0.00" formik={formik} />
        )}

        <Input name="notes" label="Notas (opcional)" placeholder="Referencia, método de pago..." maxLength={250} formik={formik} />
    </section>
    );
};

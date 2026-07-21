import { CreditCard } from "lucide-react";
import { useSubscriptionPage } from "./useSubscriptionPage";
import { SubscriptionStatusCard } from "./partials/SubscriptionStatusCard";
import { SubscriptionPlanCard } from "./partials/SubscriptionPlanCard";
import { PaymentInfoCard } from "./partials/PaymentInfoCard";
import { RenewalCard } from "./partials/RenewalCard";

function SubscriptionPage() {
    const { data, isLoading, planLabel, expiresLabel, whatsappUrl } = useSubscriptionPage();

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-amber-600" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Mi suscripción</h1>
                    <p className="text-xs text-stone-400">Estado actual de tu plan</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data ? (
                <div className="flex flex-col gap-4">
                    <SubscriptionStatusCard status={data.status} daysRemaining={data.days_remaining} />

                    <SubscriptionPlanCard
                        planLabel={planLabel}
                        expiresLabel={expiresLabel}
                        daysRemaining={data.days_remaining}
                        isLifetime={data.plan === "lifetime"}
                    />

                    {data.payment_info && (
                        <PaymentInfoCard info={data.payment_info} amountDue={data.amount_due} />
                    )}

                    <RenewalCard whatsappUrl={whatsappUrl} />
                </div>
            ) : null}
        </div>
    );
}

export default SubscriptionPage;

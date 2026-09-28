import { X } from "lucide-react";
import { ISubscriptionExpiredInfo } from "@/models/ISubscription";
import { PaymentInfoCard } from "@/components/subscription/PaymentInfoCard";
import { RenewalCard } from "@/components/subscription/RenewalCard";
import { buildWhatsappRenewalUrl } from "@/utils/subscriptionRenewal";

interface SubscriptionExpiredModalProps {
    info: ISubscriptionExpiredInfo;
    onClose: () => void;
}

export const SubscriptionExpiredModal = ({ info, onClose }: SubscriptionExpiredModalProps) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100 shrink-0">
                <h2 className="font-semibold text-stone-900 text-sm">Datos para renovar tu suscripción</h2>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4">
                {info.payment_info && <PaymentInfoCard info={info.payment_info} amountDue={info.amount_due} />}
                <RenewalCard whatsappUrl={buildWhatsappRenewalUrl(info.business_name, info.payment_whatsapp)} />
            </div>
        </div>
    </div>
);

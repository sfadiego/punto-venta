import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { SubscriptionPlanEnum, PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";

export interface IPaymentInfo {
    bank: string;
    account: string;
    holder: string;
    concept: string;
}

export interface ISubscriptionDetail {
    status: SubscriptionStatusEnum;
    plan: SubscriptionPlanEnum | null;
    days_remaining: number | null;
    expires_at: string | null;
    business_name: string;
    payment_whatsapp: string | null;
    payment_info: IPaymentInfo | null;
}

export const useSubscriptionPage = () => {
    const { data, isLoading } = useGET<ISubscriptionDetail>({
        url: `${ApiRoutes.BusinessConfig}/subscription-status`,
        nameQuery: "subscription-detail",
    });

    const planLabel = data?.plan ? PLAN_LABELS[data.plan] : null;

    const expiresLabel = data?.expires_at
        ? new Date(data.expires_at + "T00:00:00").toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : null;

    const whatsappUrl = (() => {
        if (!data?.payment_whatsapp) return null;

        const plan = planLabel ?? "mi plan";
        const message = [
            `Hola, soy ${data.business_name}.`,
            `Quiero renovar mi suscripción (${plan}) y adjunto mi comprobante de pago.`,
            `Quedo pendiente de confirmación. ¡Gracias!`,
        ].join(" ");

        return `https://wa.me/${data.payment_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    })();

    return { data, isLoading, planLabel, expiresLabel, whatsappUrl };
};

import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";
import { ISubscriptionDetail } from "@/models/ISubscription";

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

        const message = [
            `Hola, soy ${data.business_name}.`,
            `Quiero renovar mi suscripción y adjunto mi comprobante de pago.`,
            `Quedo pendiente de confirmación. ¡Gracias!`,
        ].join(" ");

        return `https://wa.me/${data.payment_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    })();

    return { data, isLoading, planLabel, expiresLabel, whatsappUrl };
};

import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";
import { ISubscriptionDetail } from "@/models/ISubscription";
import { buildWhatsappRenewalUrl } from "@/utils/subscriptionRenewal";

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

    const whatsappUrl = data ? buildWhatsappRenewalUrl(data.business_name, data.payment_whatsapp) : null;

    return { data, isLoading, planLabel, expiresLabel, whatsappUrl };
};

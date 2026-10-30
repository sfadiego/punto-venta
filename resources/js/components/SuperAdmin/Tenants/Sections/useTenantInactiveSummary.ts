import { toast } from "react-toastify";
import { ITenant } from "@/models/ITenant";
import { BUSINESS_TYPE_LABELS } from "@/enums/BusinessTypeEnum";
import { PLAN_LABELS, SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { useToggleTenant } from "@/services/useSuperAdminService";
import { formatOrderDateTime } from "@/utils/dateUtils";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface ITenantSummaryField {
    label: string;
    value: string;
}

export const useTenantInactiveSummary = (tenant: ITenant) => {
    const { mutateAsync: toggleTenant, isPending: isReactivating } = useToggleTenant();

    const plan = tenant.subscription_plan ? PLAN_LABELS[tenant.subscription_plan as SubscriptionPlanEnum] : null;

    const fields: ITenantSummaryField[] = [
        { label: "Nombre del negocio", value: tenant.business_name },
        { label: "Acceso del cliente", value: `/${tenant.slug}/auth` },
        { label: "Tipo de negocio", value: BUSINESS_TYPE_LABELS[tenant.tipo_negocio] },
        { label: "Cliente demo", value: tenant.is_demo ? "Sí" : "No" },
        { label: "Negocio de pruebas", value: tenant.is_test ? "Sí" : "No" },
        { label: "Plan de suscripción", value: plan ?? "Sin plan" },
        { label: "Usuarios registrados", value: String(tenant.users_count ?? 0) },
        { label: "Última actividad", value: tenant.last_activity_at ? formatOrderDateTime(tenant.last_activity_at) : "Sin actividad" },
    ];

    const handleReactivate = async () => {
        try {
            await toggleTenant(tenant.id);
            toast.success("Cliente reactivado.");
        } catch (error) {
            logUnexpectedError(error, "useTenantInactiveSummary.handleReactivate");
            toast.error(getUserFacingErrorMessage(error, "No se pudo reactivar el cliente."));
        }
    };

    return { fields, isReactivating, handleReactivate };
};

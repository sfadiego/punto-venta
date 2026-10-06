import { useNavigate } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { usePermissions } from "@/hooks/usePermissions";
import { useLayawaySummary } from "@/services/useLayawayService";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

// Aviso de apartados vencidos / por vencer del dashboard (solo retail con permiso `layaway`).
export const useLayawayDueAlert = () => {
    const navigate = useNavigate();
    const { features, branchId } = useAxios();
    const { can } = usePermissions();
    const enabled = features?.is_retail === true && can("layaway");
    const { data: summary } = useLayawaySummary(branchId, enabled);

    return {
        overdueCount: enabled ? (summary?.overdue_count ?? 0) : 0,
        dueSoonCount: enabled ? (summary?.due_soon_count ?? 0) : 0,
        goToLayaways: () => navigate(`${AdminRoutes.OrderList}?estatus=${OrderStatusEnum.Layaway}`),
    };
};

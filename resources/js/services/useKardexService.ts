import { IStockMovement } from "@/models/IStockMovement";
import { useGET } from "../hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginate } from "@/intefaces/IPaginate";
import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { StockMovementReasonEnum } from "@/enums/StockMovementReasonEnum";

const url = ApiRoutes.Kardex;

// Kardex global del módulo de Inventario — a diferencia de useInfiniteStockMovements
// (useProductService.ts, kardex por producto), no exige ningún producto: lista todo el
// historial de stock_movements del tenant, paginado, con filtros opcionales.
export const useIndexKardex = ({
    page = 1,
    limit = 15,
    productId,
    variantId,
    type,
    reason,
    fechaDesde,
    fechaHasta,
}: {
    page?: number;
    limit?: number;
    productId?: number | null;
    variantId?: number | null;
    type?: StockMovementTypeEnum | "";
    reason?: StockMovementReasonEnum | "";
    fechaDesde?: string;
    fechaHasta?: string;
}) =>
    useGET<IPaginate<IStockMovement>>({
        url,
        filters: {
            page,
            limit,
            ...(productId ? { product_id: productId } : {}),
            ...(variantId ? { variant_id: variantId } : {}),
            ...(type ? { type } : {}),
            ...(reason ? { reason } : {}),
            ...(fechaDesde ? { fecha_desde: fechaDesde } : {}),
            ...(fechaHasta ? { fecha_hasta: fechaHasta } : {}),
        },
    });

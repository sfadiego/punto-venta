import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { StockMovementReasonEnum } from "@/enums/StockMovementReasonEnum";

export interface IStockMovement {
    id: number;
    product_id: number;
    variant_id?: number | null;
    type: StockMovementTypeEnum;
    // decimales del backend (cast decimal:2) llegan como string, no number
    quantity: string;
    stock_before: string;
    stock_after: string;
    reason: StockMovementReasonEnum;
    note: string | null;
    created_by: { id: number; nombre: string } | null;
    created_at: string;
    // Solo presentes en el kardex global (GET /api/kardex) — el kardex por producto
    // (GET /api/product/{id}/stock-movements) no los necesita, ya está en ese contexto.
    product?: { id: number; nombre: string } | null;
    variant?: { id: number; nombre: string } | null;
}

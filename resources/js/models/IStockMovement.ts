import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { StockMovementReasonEnum } from "@/enums/StockMovementReasonEnum";

export interface IStockMovement {
    id: number;
    product_id: number;
    type: StockMovementTypeEnum;
    // decimales del backend (cast decimal:2) llegan como string, no number
    quantity: string;
    stock_before: string;
    stock_after: string;
    reason: StockMovementReasonEnum;
    note: string | null;
    created_by: { id: number; nombre: string } | null;
    created_at: string;
}

export enum StockMovementReasonEnum {
    Sale = "sale",
    Return = "return",
    ManualAdjustment = "manual_adjustment",
    Loss = "loss",
    InitialStock = "initial_stock",
}

export const STOCK_MOVEMENT_REASON_LABELS: Record<StockMovementReasonEnum, string> = {
    [StockMovementReasonEnum.Sale]: "Venta",
    [StockMovementReasonEnum.Return]: "Devolución",
    [StockMovementReasonEnum.ManualAdjustment]: "Ajuste manual",
    [StockMovementReasonEnum.Loss]: "Merma",
    [StockMovementReasonEnum.InitialStock]: "Stock inicial",
};

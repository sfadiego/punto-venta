export enum StockMovementTypeEnum {
    Entry = "entry",
    Exit = "exit",
    Adjustment = "adjustment",
}

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementTypeEnum, string> = {
    [StockMovementTypeEnum.Entry]: "Entrada",
    [StockMovementTypeEnum.Exit]: "Salida",
    [StockMovementTypeEnum.Adjustment]: "Ajuste",
};

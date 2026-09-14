import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { StockMovementReasonEnum } from "@/enums/StockMovementReasonEnum";

// Tipo y razón de un movimiento de stock no son totalmente independientes — la mayoría de
// las razones solo puede producir un tipo específico (ej. una "Venta" siempre es una
// "Salida"; ver StockService::deduct/restore/adjust, cada método hardcodea su propio tipo).
// La única excepción es "Stock inicial": puede ser una "Entrada" real (producto/variante
// nuevos, o creación por importación — vía StockService::restore()) o un "Ajuste" (activar
// manage_stock en un producto que ya existía, sin historial previo que proteger — vía
// StockService::adjust(), ver ProductController::update()).
//
// El filtro de Inventario pide el Tipo primero (InventoryPage.tsx oculta Razón hasta
// entonces) y usa este mapa para acotar las Razones ofrecidas a las que ese tipo realmente
// puede tener — así nunca se arma una combinación imposible (que solo devolvería una tabla
// vacía sin explicar por qué).
export const REASONS_BY_TYPE: Record<StockMovementTypeEnum, StockMovementReasonEnum[]> = {
    [StockMovementTypeEnum.Entry]: [StockMovementReasonEnum.Return, StockMovementReasonEnum.InitialStock],
    [StockMovementTypeEnum.Exit]: [StockMovementReasonEnum.Sale, StockMovementReasonEnum.Loss],
    [StockMovementTypeEnum.Adjustment]: [StockMovementReasonEnum.ManualAdjustment, StockMovementReasonEnum.InitialStock],
};

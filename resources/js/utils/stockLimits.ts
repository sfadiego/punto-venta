// Debe reflejar StockService::MAX_STOCK (backend) — tope de la columna stock/min_stock/
// quantity (decimal(8,2)). Usado para validar el delta de un reajuste antes de enviarlo,
// evitando que un valor mal tecleado (ej. un cero de más) dependa del error 422 del backend
// para dar feedback al usuario.
export const MAX_STOCK_ADJUSTMENT = 999999.99;

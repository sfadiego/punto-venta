/**
 * Calcula el total a cobrar al cliente incluyendo o no el domicilio.
 * - "cliente paga": POS cobra domicilio al cliente → total + domicilio
 * - "negocio absorbe": cliente paga solo productos → total
 */
export const calcDeliveryTotal = (
    total: number,
    domicilio: number,
    domicilioActivo: boolean,
    customerPays: boolean,
): number => {
    if (!domicilioActivo || domicilio <= 0) return total;
    return customerPays ? total + domicilio : total;
};

/**
 * Calcula el valor de costo_domicilio a guardar en la orden.
 * +X = cliente paga (informativo; no aparece como deducción en cierre de caja)
 * -X = negocio absorbe (se descuenta del neto en el corte de caja)
 *  0 = sin domicilio
 */
export const calcCostoDomicilio = (
    domicilio: number,
    domicilioActivo: boolean,
    customerPays: boolean,
): number => {
    if (!domicilioActivo || domicilio <= 0) return 0;
    return customerPays ? domicilio : -domicilio;
};

/**
 * El negocio absorbe un domicilio mayor al total de los productos: no hay de dónde descontarlo,
 * así que la venta no se puede cobrar.
 */
export const isDeliveryOverTotal = (
    total: number,
    domicilio: number,
    domicilioActivo: boolean,
    customerPays: boolean,
): boolean => domicilioActivo && !customerPays && domicilio > total && total > 0;

/**
 * Lee el domicilio guardado en una orden (inverso de calcCostoDomicilio): monto en positivo,
 * quién lo paga según el signo, y si está activo (is_delivery o un costo distinto de 0).
 */
export const parseOrderDelivery = (order: {
    costo_domicilio: number | string;
    is_delivery: boolean;
}): { isActive: boolean; amount: number; customerPays: boolean } => {
    const raw = Number(order.costo_domicilio ?? 0);
    const amount = Math.abs(raw);
    return { isActive: !!order.is_delivery || amount > 0, amount, customerPays: raw >= 0 };
};

/**
 * Total final a cobrar de una orden ya guardada. `order.total` en BD nunca incluye el domicilio
 * (ver OrderController::update / OrderSaleService::createDirectSale, que lo calculan solo desde
 * order_products) — cualquier listado que muestre el total de una orden con envío activo debe
 * pasar por aquí, no leer `total` directo, o subestima el monto cuando lo paga el cliente.
 */
export const calcOrderDisplayTotal = (order: {
    total: number;
    costo_domicilio: number | string;
    is_delivery: boolean;
}): number => {
    const { amount, customerPays } = parseOrderDelivery(order);
    return calcDeliveryTotal(order.total, amount, order.is_delivery, customerPays);
};

/**
 * Calcula el efectivo esperado en caja al cierre.
 * Los domicilios absorbidos por el negocio se pagan al repartidor en efectivo,
 * por lo que reducen el efectivo disponible en caja.
 * Para restaurantes totalDomicilios = 0 → no tiene efecto.
 * Los gastos extra (compra de insumos, etc.) siempre se pagan en efectivo,
 * por lo que también reducen el efectivo disponible en caja.
 */
export const calcEfectivoCierre = (
    efectivoInicio: number,
    totalEfectivoPagado: number,
    totalPropinaEfectivo: number,
    totalDomicilios: number,
    totalGastos: number = 0,
): number => efectivoInicio + totalEfectivoPagado + totalPropinaEfectivo - totalDomicilios - totalGastos;

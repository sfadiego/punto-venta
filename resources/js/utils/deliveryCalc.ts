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
    const rawDomicilio = Number(order.costo_domicilio ?? 0);
    const domicilio = Math.abs(rawDomicilio);
    const customerPays = rawDomicilio >= 0;
    return calcDeliveryTotal(order.total, domicilio, order.is_delivery, customerPays);
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

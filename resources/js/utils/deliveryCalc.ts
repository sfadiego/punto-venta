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
 * Calcula el efectivo esperado en caja al cierre.
 * Los domicilios absorbidos por el negocio se pagan al repartidor en efectivo,
 * por lo que reducen el efectivo disponible en caja.
 * Para restaurantes totalDomicilios = 0 → no tiene efecto.
 */
export const calcEfectivoCierre = (
    efectivoInicio: number,
    totalEfectivoPagado: number,
    totalPropinaEfectivo: number,
    totalDomicilios: number,
): number => efectivoInicio + totalEfectivoPagado + totalPropinaEfectivo - totalDomicilios;

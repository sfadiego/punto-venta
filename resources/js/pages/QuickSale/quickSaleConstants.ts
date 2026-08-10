// Debe igualar el max:99 de OrderProductModel::CANTIDAD en OrderProductStoreRequest /
// OrderProductUpdateRequest — validar esto en el frontend evita el viaje al servidor solo
// para recibir el 422 (ej. al convertir un monto grande en el modo $ de la card a kilos).
export const MAX_CANTIDAD_KG = 99;

// Espejo de las reglas del backend para el código de producto: App\Services\Code128Encoder::isEncodable()
// y ProductModel::normalizeProductCode(). Si una cambia, la otra tiene que cambiar igual: el servidor es
// la protección real y esto solo evita el viaje de ida y vuelta.

// Solo ASCII imprimible: es lo que el generador de código de barras (Code128) puede dibujar.
const PRODUCT_CODE_PATTERN = /^[\x20-\x7E]+$/;

export const PRODUCT_CODE_INVALID_MESSAGE =
    "Solo letras sin acento, números y símbolos comunes (sin acentos, ñ ni emojis)";

/** Recorta los extremos y cambia los espacios internos por un guion ("REG 010" → "REG-010"). */
export const normalizeProductCode = (code: string): string =>
    code.replace(/^\s+|\s+$/g, "").replace(/\s+/g, "-");

/** ¿El código se puede dibujar como código de barras? Un código vacío es válido (se genera uno solo). */
export const isProductCodeEncodable = (code: string): boolean => code === "" || PRODUCT_CODE_PATTERN.test(code);

/**
 * Valida el código del formulario. Se valida ya normalizado (los espacios pasan a guion, así que
 * nunca fallan) y un código que no cambió respecto al guardado se deja pasar: un producto viejo con
 * un código no válido sigue siendo editable (ver ProductUpdateRequest).
 */
export const isProductCodeAllowed = (code: string | undefined, storedCode: string | null): boolean => {
    if (!code || code === storedCode) return true;

    return isProductCodeEncodable(normalizeProductCode(code));
};

/**
 * Valor de product_code que se envía al guardar. Uno que no cambió se manda tal cual (el backend no
 * debe tocar el código de una etiqueta ya impresa); uno nuevo o modificado se manda normalizado.
 * Vacío = no se envía.
 */
export const getProductCodePayload = (code: string, storedCode: string | null): string | undefined => {
    const value = code === storedCode ? code : normalizeProductCode(code);

    return value || undefined;
};

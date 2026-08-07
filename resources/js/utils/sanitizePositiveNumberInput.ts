// Limpia el valor crudo de un <input type="number"> de solo-positivos: quita signos "-"
// (los inputs number nativos no bloquean tipearlo) y ceros a la izquierda (ej. "0200" -> "200").
export const sanitizePositiveNumberInput = (value: string): string =>
    value.replace(/-/g, "").replace(/^0+(?=\d)/, "");

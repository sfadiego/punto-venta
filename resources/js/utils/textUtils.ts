/** Texto sin espacios en los extremos, o `null` si queda vacío: para los campos opcionales de un
 *  formulario que el backend espera como `null` cuando no se capturó nada. */
export const trimOrNull = (value: string): string | null => value.trim() || null;

/** Como `trimOrNull`, pero devuelve `undefined`: para los campos opcionales que simplemente no se
 *  envían en la petición cuando no se capturó nada. */
export const trimOrUndefined = (value: string): string | undefined => value.trim() || undefined;

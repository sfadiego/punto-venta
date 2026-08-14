export const capitalizeFirstLetter = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (trimmed === trimmed.toUpperCase()) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

// Minúsculas + sin acentos, para comparar búsquedas del usuario contra etiquetas en español
// sin que un "sandwich" sin tilde falle contra un catálogo que guarda "Sándwich".
export const normalizeForSearch = (value: string): string =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

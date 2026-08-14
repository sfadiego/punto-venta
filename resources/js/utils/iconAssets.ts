import { IOpenmojiIcon, OPENMOJI_CATALOG } from "@/constants/openmojiCatalog";

export const getOpenmojiIconPath = (key: string): string => `/images/product-icons/${key}.svg`;

// Claves del catálogo que OpenMoji dibuja pero que no tienen equivalente real en las fuentes
// de emoji del sistema operativo: extras propios de OpenMoji fuera de Unicode (Private Use
// Area, ej. "E153") o combinaciones ZWJ inventadas por OpenMoji para variantes de color (ej.
// limón + cuadro verde = "Lima") que un emoji nativo no interpreta como una sola figura.
const NON_NATIVE_KEYS = new Set([
    "E153", "E0D0", "E0CA", "E312", "E0CE",
    "1F344-200D-1F7EB", "1F34B-200D-1F7E9",
]);

// Convierte el hexcode del catálogo (uno o más codepoints separados por "-") al carácter
// emoji real, para renderizarlo como texto con la fuente nativa del sistema en vez de la
// imagen OpenMoji. Devuelve null si esa clave no tiene un emoji nativo equivalente.
export const hexToEmoji = (key: string): string | null => {
    if (NON_NATIVE_KEYS.has(key)) return null;
    return key
        .split("-")
        .map((part) => String.fromCodePoint(parseInt(part, 16)))
        .join("");
};

const groupByCategory = (icons: IOpenmojiIcon[]): [string, IOpenmojiIcon[]][] => {
    const map = new Map<string, IOpenmojiIcon[]>();
    for (const icon of icons) {
        map.set(icon.group, [...(map.get(icon.group) ?? []), icon]);
    }
    return Array.from(map.entries());
};

// El catálogo ya viene ordenado por grupo (ver script de generación), así que basta
// preservar el orden de inserción para no romper el agrupamiento visual del picker.
// `search` filtra por label antes de agrupar (usado por el buscador del picker).
export const groupOpenmojiCatalog = (search = ""): [string, IOpenmojiIcon[]][] => {
    const query = search.trim().toLowerCase();
    const source = query
        ? OPENMOJI_CATALOG.filter((icon) => icon.label.toLowerCase().includes(query))
        : OPENMOJI_CATALOG;

    return groupByCategory(source);
};

// Mismo catálogo/agrupamiento que groupOpenmojiCatalog, pero solo con las claves que sí
// tienen un emoji nativo real (ver NON_NATIVE_KEYS) — usado por el tab "Emoji" del picker.
export const groupNativeEmojiCatalog = (search = ""): [string, IOpenmojiIcon[]][] => {
    const query = search.trim().toLowerCase();
    const source = OPENMOJI_CATALOG.filter((icon) => {
        if (hexToEmoji(icon.key) === null) return false;
        return query ? icon.label.toLowerCase().includes(query) : true;
    });

    return groupByCategory(source);
};

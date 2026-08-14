import { IOpenmojiIcon, OPENMOJI_CATALOG } from "@/constants/openmojiCatalog";
import { normalizeForSearch } from "@/utils/textCase";

export const getOpenmojiIconPath = (key: string): string => `/images/product-icons/${key}.svg`;

// Claves del catálogo que OpenMoji dibuja pero que estructuralmente no pueden mapear a un
// emoji nativo real: extras propios de OpenMoji fuera de Unicode (Private Use Area, ej.
// "E153") o combinaciones ZWJ inventadas por OpenMoji para variantes de color (ej. limón +
// cuadro verde = "Lima") — un emoji nativo no las interpreta como una sola figura, aunque la
// fuente del sistema sí tenga glifo para cada codepoint por separado.
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

// Detección en runtime de soporte de emoji: OpenMoji dibuja codepoints Unicode válidos que
// son demasiado recientes (ej. "🫙" Pickle, U+1FADD, agregado en Unicode 15) para la fuente de
// emoji instalada en el sistema/navegador del usuario — ahí no hay glifo de color, se muestra
// una caja "tofu" con el hex crudo. No hay forma de saberlo de antemano (depende del SO/versión
// del usuario, no del codepoint en sí), así que se compara el render en un canvas contra un
// codepoint de control garantizado sin glifo: si el resultado es idéntico, el emoji tampoco
// tiene glifo real y se excluye. El resultado se cachea por sesión ya que no cambia mientras
// el navegador siga abierto.
let supportCache: Map<string, boolean> | null = null;
let unsupportedProbeImage: string | null = null;

const PROBE_SIZE = 24;

const renderToImageData = (ctx: CanvasRenderingContext2D, char: string): string => {
    ctx.clearRect(0, 0, PROBE_SIZE, PROBE_SIZE);
    ctx.font = `${PROBE_SIZE - 4}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(char, 0, 0);
    return ctx.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data.join(",");
};

export const isEmojiSupported = (char: string): boolean => {
    if (typeof document === "undefined") return true;
    if (supportCache?.has(char)) return supportCache.get(char) as boolean;

    const canvas = document.createElement("canvas");
    canvas.width = PROBE_SIZE;
    canvas.height = PROBE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;

    if (!supportCache) supportCache = new Map();
    // Codepoint reservado ("noncharacter") — ninguna fuente le asigna un glifo real, así que
    // su render sirve de huella de referencia para "sin glifo".
    unsupportedProbeImage ??= renderToImageData(ctx, "\u{1FFFF}");

    const supported = renderToImageData(ctx, char) !== unsupportedProbeImage;
    supportCache.set(char, supported);
    return supported;
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
    const query = normalizeForSearch(search.trim());
    const source = query
        ? OPENMOJI_CATALOG.filter((icon) => normalizeForSearch(icon.label).includes(query))
        : OPENMOJI_CATALOG;

    return groupByCategory(source);
};

// Mismo catálogo/agrupamiento que groupOpenmojiCatalog, pero solo con las claves que sí
// tienen un emoji nativo real (ver NON_NATIVE_KEYS) — usado por el tab "Emoji" del picker.
export const groupNativeEmojiCatalog = (search = ""): [string, IOpenmojiIcon[]][] => {
    const query = normalizeForSearch(search.trim());
    const source = OPENMOJI_CATALOG.filter((icon) => {
        const emoji = hexToEmoji(icon.key);
        if (emoji === null || !isEmojiSupported(emoji)) return false;
        return query ? normalizeForSearch(icon.label).includes(query) : true;
    });

    return groupByCategory(source);
};

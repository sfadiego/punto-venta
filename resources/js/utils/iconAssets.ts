import { IOpenmojiIcon, OPENMOJI_CATALOG } from "@/constants/openmojiCatalog";

export const getOpenmojiIconPath = (key: string): string => `/images/product-icons/${key}.svg`;

// El catálogo ya viene ordenado por grupo (ver script de generación), así que basta
// preservar el orden de inserción para no romper el agrupamiento visual del picker.
// `search` filtra por label antes de agrupar (usado por el buscador del picker).
export const groupOpenmojiCatalog = (search = ""): [string, IOpenmojiIcon[]][] => {
    const query = search.trim().toLowerCase();
    const source = query
        ? OPENMOJI_CATALOG.filter((icon) => icon.label.toLowerCase().includes(query))
        : OPENMOJI_CATALOG;

    const map = new Map<string, IOpenmojiIcon[]>();
    for (const icon of source) {
        map.set(icon.group, [...(map.get(icon.group) ?? []), icon]);
    }
    return Array.from(map.entries());
};

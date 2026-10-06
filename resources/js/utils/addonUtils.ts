import { IAddon } from "@/models/IAddon";
import { ICategory } from "@/models/ICategory";
import { IProduct } from "@/models/IProduct";
import { formatMoney } from "@/utils/formatCurrency";

// Filtra el catálogo por coincidencia parcial del nombre (sin distinguir mayúsculas).
export const filterAddonsByQuery = (addons: IAddon[], query: string): IAddon[] => {
    const term = query.trim().toLowerCase();
    return addons.filter((addon) => addon.name.toLowerCase().includes(term));
};

// Ofrecer "Crear" solo cuando hay texto y no existe ya un topping con exactamente ese nombre.
export const canCreateAddon = (addons: IAddon[], query: string): boolean => {
    const term = query.trim().toLowerCase();
    return term !== "" && !addons.some((addon) => addon.name.toLowerCase() === term);
};

export const formatAddonPrice = (price: number): string => (price > 0 ? `$${formatMoney(price)}` : "Sin costo");

export interface IProductCategoryGroup {
    categoryId: number;
    categoryName: string;
    products: IProduct[];
}

const NO_CATEGORY_ID = 0;

// Agrupa productos por categoría respetando el orden de las categorías; omite las vacías.
// Un producto cuya categoría no viene en la lista (borrada, por ejemplo) cae en "Sin categoría".
export const groupProductsByCategory = (products: IProduct[], categories: ICategory[]): IProductCategoryGroup[] => {
    const groups = new Map<number, IProductCategoryGroup>();
    categories.forEach((category) => {
        if (category.id !== undefined) {
            groups.set(category.id, { categoryId: category.id, categoryName: category.nombre, products: [] });
        }
    });

    products.forEach((product) => {
        let group = groups.get(product.categoria_id);
        if (!group) {
            group = groups.get(NO_CATEGORY_ID) ?? { categoryId: NO_CATEGORY_ID, categoryName: "Sin categoría", products: [] };
            groups.set(NO_CATEGORY_ID, group);
        }
        group.products.push(product);
    });

    return [...groups.values()].filter((group) => group.products.length > 0);
};

export interface ICategorySelectionState {
    selectedCount: number;
    checked: boolean;
    indeterminate: boolean;
}

// Estado de la casilla de una categoría: marcada si todos sus productos lo están, intermedia si solo algunos.
export const getCategorySelectionState = (products: IProduct[], selectedIds: Set<number>): ICategorySelectionState => {
    const selectedCount = products.filter((product) => selectedIds.has(product.id)).length;
    return {
        selectedCount,
        checked: products.length > 0 && selectedCount === products.length,
        indeterminate: selectedCount > 0 && selectedCount < products.length,
    };
};

// Alterna un conjunto de ids: si todos ya estaban, los quita; si no, agrega los que faltan.
export const toggleIdsInSet = (current: Set<number>, ids: number[]): Set<number> => {
    const next = new Set(current);
    const allSelected = ids.every((id) => next.has(id));
    ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
    return next;
};

// Filtra productos por coincidencia parcial del nombre (sin distinguir mayúsculas).
export const filterProductsByName = (products: IProduct[], query: string): IProduct[] => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => product.nombre.toLowerCase().includes(term));
};

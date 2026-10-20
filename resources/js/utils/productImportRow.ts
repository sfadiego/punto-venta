import { ProductImportRowActionEnum } from "@/enums/ProductImportRowActionEnum";

const ROW_ACTION_LABELS: Record<ProductImportRowActionEnum, string> = {
    [ProductImportRowActionEnum.Create]: "CREAR",
    [ProductImportRowActionEnum.Update]: "ACTUALIZAR",
    [ProductImportRowActionEnum.Error]: "ERROR",
    [ProductImportRowActionEnum.Skip]: "OMITIDA",
};

export const getImportRowLabel = (action: ProductImportRowActionEnum): string => ROW_ACTION_LABELS[action];

/** Colores de la etiqueta de una fila en la vista previa: error y omitida van por su acción; el resto, por si trae avisos. */
export const getImportRowBadgeClass = (action: ProductImportRowActionEnum, hasWarnings: boolean): string => {
    if (action === ProductImportRowActionEnum.Error) return "bg-red-100 text-red-700";
    if (action === ProductImportRowActionEnum.Skip) return "bg-stone-200 text-stone-600";

    return hasWarnings ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
};

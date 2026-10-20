import { CatalogExportFormatEnum } from "@/enums/CatalogExportFormatEnum";
import { localDateString } from "@/utils/dateUtils";

const UNSAFE_FILENAME_CHARS = /[^A-Za-z0-9_-]/g;

/**
 * Nombre de la imagen del código de barras de un producto. Usa el mismo valor que el backend
 * imprime (product_code o, si no tiene, el id — ProductModel::barcodeValue()) sin los
 * caracteres que no son seguros en un nombre de archivo.
 */
export const getBarcodeImageFilename = (product: { id: number; product_code: string | null }): string => {
    const code = product.product_code ? product.product_code : String(product.id);
    const safeCode = code.replace(UNSAFE_FILENAME_CHARS, "") || String(product.id);

    return `codigo-de-barras-${safeCode}.png`;
};

/** Nombre del archivo descargado del catálogo — el PDF con códigos de barras se distingue del resto. */
export const getCatalogFilename = (
    format: CatalogExportFormatEnum,
    includeBarcode: boolean,
    date = new Date(),
): string => {
    const day = localDateString(date);

    if (format === CatalogExportFormatEnum.Csv) return `catalogo-productos-${day}.csv`;

    return `${includeBarcode ? "catalogo-codigos-de-barras" : "catalogo-productos"}-${day}.pdf`;
};

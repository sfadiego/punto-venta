import { axiosGET, usePOST } from "../hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = `${ApiRoutes.Product}/import`;

export interface IProductImportRowData {
    action: "create" | "update";
    existing_product_id: number | null;
    product_code: string | null;
    nombre: string;
    precio: number;
    categoria: string;
    categoria_status: "existing" | "new";
    categoria_id: number | null;
    descripcion: string;
    unidad_medida: string;
    manage_stock: boolean;
    stock: number | null;
    min_stock: number | null;
    activo: boolean;
    product_id?: number;
}

export interface IProductImportRow {
    row: number;
    action: "create" | "update" | "error";
    errors: string[];
    warnings: string[];
    data: IProductImportRowData | Record<string, never>;
}

export interface IProductImportReport {
    summary: {
        total: number;
        to_create: number;
        to_update: number;
        errors: number;
        warnings: number;
    };
    rows: IProductImportRow[];
}

// Importación masiva de productos (CSV) — módulo de Inventario, exclusivo retail. preview()
// no escribe nada; commit() aplica exactamente lo que preview() ya reportó (mismo archivo).
// Sin tipar el genérico de usePOST: el envoltorio {status, message, data} de Response::success()
// no se desenvuelve para mutaciones (a diferencia de axiosGET) — el consumidor castea
// res.data.data al tipo real, mismo patrón que useStoreOrderSale/useQuickSalePayment.
export const useImportProductsPreview = () => usePOST({ url: `${url}/preview`, isFile: true });

export const useImportProductsCommit = () => usePOST({ url: `${url}/commit`, isFile: true });

export const useDownloadImportTemplate = () => {
    const { axiosApi } = useAxios();

    return (): Promise<Blob> =>
        axiosGET(axiosApi, { url: `${url}/template`, responseType: "blob" });
};

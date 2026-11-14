import { useEffect } from "react";

interface IUseClampPageParams {
    page: number;
    /** Total de registros del servidor; undefined mientras no hay respuesta (no confundir con 0). */
    total: number | undefined;
    limit: number;
    isFetching: boolean;
    setPage: (page: number) => void;
}

// Si la página actual queda fuera de rango (cambió el tamaño de página, se borró el último
// elemento de la última página), regresa a la última página válida. Sin esto la tabla queda sin
// filas y mantine-datatable oculta el paginador, sin forma de volver.
export const useClampPage = ({ page, total, limit, isFetching, setPage }: IUseClampPageParams) => {
    useEffect(() => {
        if (isFetching || total === undefined) return;
        const lastPage = Math.max(1, Math.ceil(total / limit));
        if (page > lastPage) setPage(lastPage);
    }, [page, total, limit, isFetching, setPage]);
};

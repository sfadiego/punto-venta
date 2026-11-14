import { useState } from "react";
import { useClampPage } from "@/hooks/useClampPage";

// Solo lo que el hook lee de la respuesta; así acepta cualquier IPaginate<T> sin pelear con sus columnas.
interface ITableQuery {
    data: { data: unknown[]; total: number } | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    refetch: () => unknown;
}

// `never` en el parámetro acepta cualquier hook de servicio; los tipos reales salen de Parameters/ReturnType.
type TService = (params: never) => ITableQuery;

/** Filtros que acepta el servicio, sin `page` ni `limit` (los maneja el hook). */
type TTableFilters<S extends TService> = Omit<NonNullable<Parameters<S>[0]>, "page" | "limit">;

type TTableRecord<S extends TService> = NonNullable<ReturnType<S>["data"]>["data"][number];

/** Lo que `useServerTable` entrega para `CustomDataTable`; sirve para tipar componentes que lo reciben por props. */
export interface IServerTableProps<T> {
    records: T[];
    totalRecords: number;
    page: number;
    recordsPerPage: number;
    onPageChange: (page: number) => void;
    onRecordsPerPageChange: (limit: number) => void;
    recordsPerPageOptions: number[];
    isFetching: boolean;
}

interface IUseServerTableParams<S extends TService> {
    /** Hook de servicio de listado paginado; recibe `{ ...params, page, limit }`. */
    service: S;
    /** Filtros de la pantalla (búsqueda ya con debounce, estado, etc.). Al cambiar, la página vuelve a 1. */
    params: TTableFilters<S>;
    defaultLimit?: number;
    pageSizeOptions?: number[];
}

const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

// Estado de paginación + consulta de un listado paginado en servidor, con lo que
// `CustomDataTable` necesita ya armado en `tableProps`. Las columnas y los filtros los define la pantalla.
export const useServerTable = <S extends TService>({
    service,
    params,
    defaultLimit = DEFAULT_LIMIT,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: IUseServerTableParams<S>) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(defaultLimit);

    // Con otro filtro la página actual ya no tiene sentido: se reinicia durante el render (patrón de
    // React para ajustar estado cuando cambian las props), así no se pide la página vieja al servidor.
    const paramsKey = JSON.stringify(params);
    const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);
    if (paramsKey !== prevParamsKey) {
        setPrevParamsKey(paramsKey);
        setPage(1);
    }

    const { data, isLoading, isFetching, isRefetching, refetch } = service({ ...params, page, limit } as never);

    useClampPage({ page, total: data?.total, limit, isFetching, setPage });

    const handleLimitChange = (value: number) => {
        setLimit(value);
        setPage(1);
    };

    const tableProps: IServerTableProps<TTableRecord<S>> = {
        records: (data?.data ?? []) as TTableRecord<S>[],
        totalRecords: data?.total ?? 0,
        page,
        recordsPerPage: limit,
        onPageChange: setPage,
        onRecordsPerPageChange: handleLimitChange,
        recordsPerPageOptions: pageSizeOptions,
        isFetching,
    };

    return {
        tableProps,
        data: data as ReturnType<S>["data"],
        isLoading,
        isFetching,
        isRefetching,
        refetch,
    };
};

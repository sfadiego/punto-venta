import { ColumnProperties } from "@/components/Tables/columnProperties";
import { DataTableColumn } from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

export type DataTableRenderersMap = {
    [key: string]: (record: any) => any;
} & {
    rowClassName?: (record: any) => string | undefined;
};

interface UseDataTableParams {
    service: (params: any) => any;
    payload?: any;
    columnProperties?: ColumnProperties<unknown>;
    renderersMap?: DataTableRenderersMap;
    refetchInterval?: number;
}
export const useDataTable = ({
    service,
    payload = {},
    renderersMap = {},
    columnProperties = {} as ColumnProperties<unknown>,
    refetchInterval,
}: UseDataTableParams) => {
    const [page, setPage] = useState(1);
    const pageSize = [10, 20, 30, 50, 100];
    const [limit, setLimit] = useState(pageSize[0]);
    const { data, isLoading, isFetching, refetch } = service({ page, limit, ...payload });

    useEffect(() => {
        if (!refetchInterval) return;
        const id = setInterval(() => refetch(), refetchInterval);
        return () => clearInterval(id);
    }, [refetchInterval, refetch]);

    const applyRenderers = <T,>(
        columns: DataTableColumn<T>[],
        columnProperties: ColumnProperties<T> = {},
    ): DataTableColumn<T>[] => {
        return columns.map((column) => {
            const accessor = column.accessor as string;
            const props = columnProperties[accessor] || {};
            return {
                ...column,
                ...props,
                render:
                    accessor && renderersMap[accessor]
                        ? renderersMap[accessor]
                        : undefined,
            } as DataTableColumn<T>;
        });
    };

    const dataTableProps = useMemo(() => {
        return {
            page,
            recordsPerPage: data?.per_page ?? limit,
            totalRecords: data?.total || 0,
            onPageChange: setPage,
            columns: data?.columns
                ? applyRenderers<any>(data.columns, columnProperties)
                : [],
            records: data?.data || [],
            onRecordsPerPageChange: setLimit,
            recordsPerPageOptions: pageSize,
            noRecordsText:
                "No se encontraron resultados que coincidan con tu búsqueda",
            highlightOnHover: true,
            withTableBorder: true,
            withColumnBorders: true,
            striped: true,
            minHeight: 200,
            className: "whitespace-nowrap table-hover",
            paginationText: ({
                from,
                to,
                totalRecords,
            }: {
                from: number;
                to: number;
                totalRecords: number;
            }) => `Mostrando del ${from} al ${to} de ${totalRecords} registros`,
        };
    }, [data, isLoading, page, limit]);

    return {
        dataTableProps,
        page,
        setPage,
        limit,
        setLimit,
        pageSize,
        data,
        isLoading,
        isFetching,
        refetch,
    };
};

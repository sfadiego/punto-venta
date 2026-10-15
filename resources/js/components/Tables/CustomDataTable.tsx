import { DataTable, DataTableProps } from "mantine-datatable";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

export type CustomDataTableProps<T> = DataTableProps<T> & {
    isFetching?: boolean;
    fetchingText?: string;
};

// DataTable con los estilos comunes del proyecto y el overlay de carga incluido. Los defaults
// se pueden sobreescribir pasando el mismo prop. `isFetching` reemplaza al `fetching` de Mantine.
export const CustomDataTable = <T,>({ isFetching = false, fetchingText, ...props }: CustomDataTableProps<T>) => {
    // Se arma aparte y se tipa explícito: DataTableProps es una unión de variantes (loader
    // personalizado vs. loader de Mantine) y TS no resuelve el spread inline contra esa unión.
    const tableProps = {
        highlightOnHover: true,
        withTableBorder: true,
        withColumnBorders: true,
        striped: true,
        minHeight: 200,
        className: "whitespace-nowrap",
        classNames: { header: "pos-datatable-header" },
        noRecordsText: "No se encontraron registros",
        paginationText: ({ from, to, totalRecords }: { from: number; to: number; totalRecords: number }) =>
            `Mostrando del ${from} al ${to} de ${totalRecords} registros`,
        ...props,
    } as DataTableProps<T>;

    return (
        <div className="relative">
            <LoadingOverlay visible={isFetching} text={fetchingText} />
            <DataTable<T> {...tableProps} />
        </div>
    );
};

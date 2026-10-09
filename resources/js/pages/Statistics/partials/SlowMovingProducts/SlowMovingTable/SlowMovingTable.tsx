import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { ISlowMovingProduct } from "@/models/ISlowMovingProduct";
import { slowMovingColumns } from "./slowMovingColumns";

interface SlowMovingTableProps {
    records: ISlowMovingProduct[];
    total: number;
    page: number;
    limit: number;
    pageSizes: number[];
    sortStatus: DataTableSortStatus<ISlowMovingProduct>;
    isLoading: boolean;
    days: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onSortChange: (status: DataTableSortStatus<ISlowMovingProduct>) => void;
}

export const SlowMovingTable = ({
    records, total, page, limit, pageSizes, sortStatus, isLoading, days, onPageChange, onLimitChange, onSortChange,
}: SlowMovingTableProps) => (
    <DataTable<ISlowMovingProduct>
        columns={slowMovingColumns}
        records={records}
        fetching={isLoading}
        page={page}
        recordsPerPage={limit}
        totalRecords={total}
        onPageChange={onPageChange}
        recordsPerPageOptions={pageSizes}
        onRecordsPerPageChange={onLimitChange}
        sortStatus={sortStatus}
        onSortStatusChange={onSortChange}
        noRecordsText={`Ningún producto lleva más de ${days} días sin movimiento`}
        highlightOnHover
        withTableBorder
        withColumnBorders
        striped
        minHeight={200}
        classNames={{ header: "pos-datatable-header" }}
        paginationText={({ from, to, totalRecords }) => `Mostrando del ${from} al ${to} de ${totalRecords} productos`}
    />
);

import { DataTableSortStatus } from "mantine-datatable";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { ISlowMovingProduct } from "@/models/ISlowMovingProduct";
import { slowMovingColumns } from "./slowMovingColumns";

interface SlowMovingTableProps {
    records: ISlowMovingProduct[];
    total: number;
    page: number;
    limit: number;
    pageSizes: number[];
    sortStatus: DataTableSortStatus<ISlowMovingProduct>;
    isFetching: boolean;
    days: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onSortChange: (status: DataTableSortStatus<ISlowMovingProduct>) => void;
}

export const SlowMovingTable = ({
    records, total, page, limit, pageSizes, sortStatus, isFetching, days, onPageChange, onLimitChange, onSortChange,
}: SlowMovingTableProps) => (
    <CustomDataTable<ISlowMovingProduct>
        columns={slowMovingColumns}
        records={records}
        isFetching={isFetching}
        fetchingText="Cargando productos..."
        page={page}
        recordsPerPage={limit}
        totalRecords={total}
        onPageChange={onPageChange}
        recordsPerPageOptions={pageSizes}
        onRecordsPerPageChange={onLimitChange}
        sortStatus={sortStatus}
        onSortStatusChange={onSortChange}
        noRecordsText={`Ningún producto lleva más de ${days} días sin movimiento`}
    />
);

import { DataTableSortStatus } from "mantine-datatable";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { ISlowMovingProduct } from "@/models/ISlowMovingProduct";
import { IServerTableProps } from "@/hooks/useServerTable";
import { slowMovingColumns } from "./slowMovingColumns";

interface SlowMovingTableProps {
    tableProps: IServerTableProps<ISlowMovingProduct>;
    sortStatus: DataTableSortStatus<ISlowMovingProduct>;
    days: number;
    onSortChange: (status: DataTableSortStatus<ISlowMovingProduct>) => void;
}

export const SlowMovingTable = ({ tableProps, sortStatus, days, onSortChange }: SlowMovingTableProps) => (
    <CustomDataTable<ISlowMovingProduct>
        columns={slowMovingColumns}
        {...tableProps}
        fetchingText="Cargando productos..."
        sortStatus={sortStatus}
        onSortStatusChange={onSortChange}
        noRecordsText={`Ningún producto lleva más de ${days} días sin movimiento`}
    />
);

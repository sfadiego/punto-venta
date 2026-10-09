import { useMemo } from "react";
import { DataTable } from "mantine-datatable";
import { ICustomer } from "@/models/ICustomer";
import { buildCustomerColumns } from "./customerColumns";

interface CustomersTableProps {
    customers: ICustomer[];
    total: number;
    page: number;
    limit: number;
    pageSizes: number[];
    isLoading: boolean;
    showLayaways: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onEdit: (customer: ICustomer) => void;
}

export const CustomersTable = ({
    customers, total, page, limit, pageSizes, isLoading, showLayaways, onPageChange, onLimitChange, onEdit,
}: CustomersTableProps) => {
    const columns = useMemo(() => buildCustomerColumns({ onEdit, showLayaways }), [onEdit, showLayaways]);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <DataTable<ICustomer>
                    columns={columns}
                    records={customers}
                    fetching={isLoading}
                    page={page}
                    recordsPerPage={limit}
                    totalRecords={total}
                    onPageChange={onPageChange}
                    recordsPerPageOptions={pageSizes}
                    onRecordsPerPageChange={onLimitChange}
                    noRecordsText="No hay clientes registrados"
                    highlightOnHover
                    withTableBorder
                    withColumnBorders
                    striped
                    minHeight={200}
                    className="whitespace-nowrap"
                    classNames={{ header: "pos-datatable-header" }}
                    paginationText={({ from, to, totalRecords }) => `Mostrando del ${from} al ${to} de ${totalRecords} registros`}
                />
            </div>
        </div>
    );
};

import { useMemo } from "react";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { ICustomer } from "@/models/ICustomer";
import { buildCustomerColumns } from "./customerColumns";

interface CustomersTableProps {
    customers: ICustomer[];
    total: number;
    page: number;
    limit: number;
    pageSizes: number[];
    isFetching: boolean;
    showLayaways: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onEdit: (customer: ICustomer) => void;
}

export const CustomersTable = ({
    customers, total, page, limit, pageSizes, isFetching, showLayaways, onPageChange, onLimitChange, onEdit,
}: CustomersTableProps) => {
    const columns = useMemo(() => buildCustomerColumns({ onEdit, showLayaways }), [onEdit, showLayaways]);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <CustomDataTable<ICustomer>
                    columns={columns}
                    records={customers}
                    isFetching={isFetching}
                    fetchingText="Cargando clientes..."
                    page={page}
                    recordsPerPage={limit}
                    totalRecords={total}
                    onPageChange={onPageChange}
                    recordsPerPageOptions={pageSizes}
                    onRecordsPerPageChange={onLimitChange}
                    noRecordsText="No hay clientes registrados"
                />
            </div>
        </div>
    );
};

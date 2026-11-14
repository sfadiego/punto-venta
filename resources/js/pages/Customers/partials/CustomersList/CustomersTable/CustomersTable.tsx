import { useMemo } from "react";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { ICustomer } from "@/models/ICustomer";
import { IServerTableProps } from "@/hooks/useServerTable";
import { buildCustomerColumns } from "./customerColumns";

interface CustomersTableProps {
    tableProps: IServerTableProps<ICustomer>;
    showLayaways: boolean;
    onEdit: (customer: ICustomer) => void;
}

export const CustomersTable = ({ tableProps, showLayaways, onEdit }: CustomersTableProps) => {
    const columns = useMemo(() => buildCustomerColumns({ onEdit, showLayaways }), [onEdit, showLayaways]);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <CustomDataTable<ICustomer>
                    columns={columns}
                    {...tableProps}
                    fetchingText="Cargando clientes..."
                    noRecordsText="No hay clientes registrados"
                />
            </div>
        </div>
    );
};

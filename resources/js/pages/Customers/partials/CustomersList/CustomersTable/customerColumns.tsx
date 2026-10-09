import { DataTableColumn } from "mantine-datatable";
import { ICustomer } from "@/models/ICustomer";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { CustomerLayawayBadge } from "@/components/customers/CustomerLayawayBadge";
import { CustomerTableActions } from "./CustomerTableActions";

interface BuildCustomerColumnsParams {
    onEdit: (customer: ICustomer) => void;
    /** Apartados (solo retail): agrega la columna "Apartados". */
    showLayaways: boolean;
}

// Columnas del listado de clientes. La de Apartados solo existe en retail.
export const buildCustomerColumns = ({ onEdit, showLayaways }: BuildCustomerColumnsParams): DataTableColumn<ICustomer>[] => [
    {
        accessor: "name",
        title: "Nombre",
        render: (customer) => (
            <div>
                <span className="font-medium text-stone-900 text-sm">{customer.name}</span>
                {customer.phone && <p className="text-xs text-stone-400 mt-0.5">{customer.phone}</p>}
            </div>
        ),
    },
    {
        accessor: "balance",
        title: "Adeudo",
        width: 130,
        render: (customer) => (
            <span className={`text-sm font-semibold tabular-nums ${Number(customer.balance) > 0 ? "text-red-600" : "text-stone-400"}`}>
                {formatCurrencyTrimmed(Number(customer.balance))}
            </span>
        ),
    },
    ...(showLayaways
        ? [
              {
                  accessor: "layaway_count",
                  title: "Apartados",
                  // Cabe el chip más largo ("2 · $1,500 · 1 vencido") sin invadir la columna Crédito.
                  width: 230,
                  render: (customer: ICustomer) => <CustomerLayawayBadge customer={customer} />,
              } as DataTableColumn<ICustomer>,
          ]
        : []),
    {
        accessor: "allow_credit",
        title: "Crédito",
        width: 110,
        render: (customer) => (
            <span
                className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                    customer.allow_credit ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"
                }`}
            >
                {customer.allow_credit ? "Habilitado" : "Revocado"}
            </span>
        ),
    },
    {
        accessor: "_acciones" as keyof ICustomer,
        title: "Acciones",
        width: 120,
        textAlign: "center",
        render: (customer) => <CustomerTableActions customer={customer} onEdit={onEdit} />,
    },
];

import { DataTableColumn } from "mantine-datatable";
import { ITopDebtor } from "@/models/ITopDebtors";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateUtils";
import { CustomerLayawayBadge } from "@/components/customers/CustomerLayawayBadge";
import { DebtAgeBadge } from "./DebtAgeBadge";
import { ShareBar } from "./ShareBar";

// Top de clientes con adeudo, ya ordenado por el servidor (mayor saldo primero) — sin ordenar en el cliente.
// La columna Apartados solo existe en retail (en los demás tipos de negocio no hay apartados).
export const buildDebtorsColumns = (showLayaways: boolean): DataTableColumn<ITopDebtor>[] => [
    {
        accessor: "rank",
        title: "#",
        width: 50,
        render: (_debtor, index) => <span className="text-stone-400 tabular-nums">{index + 1}</span>,
    },
    {
        accessor: "name",
        title: "Cliente",
        render: (debtor) => (
            <div className="min-w-0">
                <p className="font-medium text-stone-900 truncate">{debtor.name}</p>
                {debtor.phone && <p className="text-xs text-stone-400">{debtor.phone}</p>}
            </div>
        ),
    },
    {
        accessor: "balance",
        title: "Adeudo",
        textAlign: "right",
        render: (debtor) => <span className="font-semibold text-red-600 tabular-nums">{formatCurrencyTrimmed(debtor.balance)}</span>,
    },
    {
        accessor: "share_percent",
        title: <span title="Qué parte del adeudo total de tus clientes le corresponde a este cliente">% de la cartera</span>,
        render: (debtor) => <ShareBar percent={debtor.share_percent} />,
    },
    ...(showLayaways
        ? [
              {
                  accessor: "layaway_count",
                  title: "Apartados",
                  render: (debtor: ITopDebtor) => <CustomerLayawayBadge customer={debtor} />,
              } as DataTableColumn<ITopDebtor>,
          ]
        : []),
    {
        accessor: "last_payment_at",
        title: "Último abono",
        render: (debtor) =>
            debtor.last_payment_at ? formatDateShort(debtor.last_payment_at) : <span className="text-stone-400">Nunca</span>,
    },
    {
        accessor: "days_without_payment",
        title: <span title="Tiempo desde su último abono (o desde su primer cargo si nunca ha abonado)">Último abono hace</span>,
        textAlign: "center",
        render: (debtor) => <DebtAgeBadge days={debtor.days_without_payment} />,
    },
];

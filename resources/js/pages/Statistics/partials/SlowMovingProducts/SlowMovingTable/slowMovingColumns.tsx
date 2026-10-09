import { DataTableColumn } from "mantine-datatable";
import { ISlowMovingProduct } from "@/models/ISlowMovingProduct";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateUtils";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { DaysIdleBadge } from "./DaysIdleBadge";

// Tabla compacta (sin scroll horizontal): lo esencial para decidir qué rebajar. El detalle completo
// — fecha de ingreso, último reabastecimiento, precio, vendido en 90 días — va en el PDF. Cada
// `accessor` coincide con una columna ordenable del backend (SlowMovingProductsReport::SORTABLE).
export const slowMovingColumns: DataTableColumn<ISlowMovingProduct>[] = [
    {
        accessor: "nombre",
        title: "Producto",
        sortable: true,
        render: (product) => (
            <div className="min-w-0">
                <p className="font-medium text-stone-900">{product.nombre}</p>
                <p className="text-xs text-stone-400">
                    {[product.product_code, product.categoria].filter(Boolean).join(" · ") || "—"}
                </p>
            </div>
        ),
    },
    {
        accessor: "days_idle",
        title: "Días sin movimiento",
        sortable: true,
        textAlign: "center",
        render: (product) => <DaysIdleBadge days={Number(product.days_idle)} />,
    },
    {
        accessor: "last_sale_at",
        title: "Última venta",
        sortable: true,
        render: (product) => (
            <div>
                <p className={product.last_sale_at ? "text-stone-700" : "text-stone-400"}>
                    {product.last_sale_at ? formatDateShort(product.last_sale_at) : "Nunca"}
                </p>
                <p className="text-xs text-stone-400">Ingreso: {formatDateShort(product.entry_date)}</p>
            </div>
        ),
    },
    {
        accessor: "stock",
        title: "Stock",
        sortable: true,
        textAlign: "right",
        render: (product) => <span className="tabular-nums">{trimDecimalZeros(product.stock)}</span>,
    },
    {
        accessor: "inventory_value",
        title: "Valor estancado",
        sortable: true,
        textAlign: "right",
        render: (product) => (
            <div>
                <p className="font-semibold text-stone-900 tabular-nums">{formatCurrencyTrimmed(Number(product.inventory_value))}</p>
                <p className="text-xs text-stone-400 tabular-nums">a {formatCurrencyTrimmed(Number(product.precio))} c/u</p>
            </div>
        ),
    },
];

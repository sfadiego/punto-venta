// Respuesta de GET /statistics/top-debtors: resumen del adeudo y los 10 clientes que más deben.
export interface ITopDebtor {
    id: number;
    name: string;
    phone: string | null;
    balance: number;
    // Qué parte del total por cobrar pesa este cliente (0-100).
    share_percent: number;
    // Fecha local "AAAA-MM-DD HH:MM:SS" de su último abono, o null si nunca ha abonado.
    last_payment_at: string | null;
    // Días desde su último abono (o desde su primer cargo/venta a crédito si nunca abonó); null si no hay referencia.
    days_without_payment: number | null;
    // Apartados activos del cliente (retail) — indicador aparte del adeudo.
    layaway_count: number;
    layaway_total: number;
    layaway_paid: number;
    layaway_overdue_count: number;
}

export interface ITopDebtorsSummary {
    total_balance: number;
    debtors_count: number;
}

export interface ITopDebtors {
    summary: ITopDebtorsSummary;
    rows: ITopDebtor[];
}

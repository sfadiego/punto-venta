<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #292524; }
        h1 { font-size: 16px; margin-bottom: 2px; }
        .period { color: #78716c; font-size: 11px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e7e5e4; }
        th { background: #fafaf9; color: #78716c; text-transform: uppercase; font-size: 9px; letter-spacing: 0.03em; }
        td.numeric, th.numeric { text-align: right; }
        tfoot td { border-top: 2px solid #292524; border-bottom: none; font-weight: bold; padding-top: 10px; }
        .summary { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .summary td {
            width: 33.33%; padding: 10px 14px; border: 1px solid #e7e5e4; border-radius: 6px;
            background: #fafaf9;
        }
        .summary .label { display: block; color: #78716c; font-size: 9px; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px; }
        .summary .value { display: block; font-size: 15px; font-weight: bold; color: #292524; }
    </style>
</head>
<body>
    <h1>Reporte de ventas</h1>
    <p class="period">{{ $periodLabel }}</p>

    <table class="summary">
        <tr>
            <td>
                <span class="label">Total de ventas</span>
                <span class="value">{{ $orders->count() }}</span>
            </td>
            <td>
                <span class="label">Ingreso total</span>
                <span class="value">${{ number_format($totalRevenue, 2) }}</span>
            </td>
            <td>
                <span class="label">Venta promedio</span>
                <span class="value">${{ number_format($averageSale, 2) }}</span>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Folio</th>
                <th>Fecha</th>
                @if ($sellByWeight)
                    <th>Cliente</th>
                @endif
                <th>Método de pago</th>
                <th class="numeric">Subtotal</th>
                <th class="numeric">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($orders as $order)
                <tr>
                    <td>#{{ $order->id }}</td>
                    <td>{{ optional($order->created_at)->format('d/m/Y H:i') }}</td>
                    @if ($sellByWeight)
                        <td>{{ $order->customer?->name ?? '—' }}</td>
                    @endif
                    <td>{{ $order->paymentMethod?->name ?? '—' }}</td>
                    <td class="numeric">${{ number_format((float) $order->subtotal, 2) }}</td>
                    <td class="numeric">${{ number_format((float) $order->total, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="{{ $sellByWeight ? 6 : 5 }}" style="text-align:center; color:#a8a29e; padding: 20px;">Sin ventas registradas</td>
                </tr>
            @endforelse
        </tbody>
        @if ($orders->isNotEmpty())
            <tfoot>
                <tr>
                    <td colspan="{{ $sellByWeight ? 5 : 4 }}">Total de ventas ({{ $orders->count() }})</td>
                    <td class="numeric">${{ number_format($totalRevenue, 2) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>
</body>
</html>

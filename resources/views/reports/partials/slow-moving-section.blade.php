@php
    $qty = fn ($n) => rtrim(rtrim(number_format((float) $n, 3, '.', ''), '0'), '.');
    $date = fn ($d) => $d ? \Carbon\Carbon::parse($d)->format('d/m/Y') : null;
    $summary = $section['summary'];
@endphp

<style>
    .slow-moving { page-break-before: always; }
    .slow-moving h2 { font-size: 14px; margin: 0 0 2px; }
    .slow-moving .asof { color: #78716c; font-size: 10px; margin: 0 0 12px; }
    .slow-moving table.detail th, .slow-moving table.detail td { padding: 4px 4px; font-size: 8px; }
    .slow-moving table.detail th { font-size: 7px; }
    .slow-moving .sub { display: block; color: #a8a29e; font-size: 7px; margin-top: 1px; }
    .slow-moving .days { font-weight: bold; }
    .slow-moving .days-critical { color: #dc2626; }
    .slow-moving .days-stagnant { color: #ea580c; }
    .slow-moving .days-attention { color: #b45309; }
    .slow-moving .muted { color: #a8a29e; }
    .slow-moving .note { margin-top: 10px; color: #78716c; font-size: 8px; }
</style>

<div class="slow-moving">
    <h2>Productos sin movimiento</h2>
    <p class="asof">Estado al {{ $section['asOf'] }} · {{ $section['days'] }} días o más sin ventas ni reabastecimiento</p>

    <table class="summary">
        <tr>
            <td>
                <span class="label">Productos estancados</span>
                <span class="value">{{ $summary['stale_count'] }}</span>
            </td>
            <td>
                <span class="label">Valor total estancado</span>
                <span class="value">${{ number_format($summary['stale_value'], 2) }}</span>
            </td>
            <td>
                <span class="label">Del inventario</span>
                <span class="value">{{ $summary['stale_value_percent'] }}%</span>
            </td>
        </tr>
    </table>

    <table class="detail">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Ingreso</th>
                <th>Últ. reabast.</th>
                <th>Últ. venta</th>
                <th class="center">Días</th>
                <th class="numeric">Stock</th>
                <th class="numeric">Precio</th>
                <th class="numeric">Valor estanc.</th>
                <th class="numeric">Vend. 90 d</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($section['products'] as $product)
                <tr>
                    <td>
                        {{ $product->nombre }}
                        <span class="sub">{{ collect([$product->product_code, $product->categoria])->filter()->implode(' · ') ?: '—' }}</span>
                    </td>
                    <td>{{ $date($product->entry_date) ?? '—' }}</td>
                    <td>{{ $date($product->last_restock_at) ?? '—' }}</td>
                    <td>@if ($product->last_sale_at){{ $date($product->last_sale_at) }}@else<span class="muted">Nunca</span>@endif</td>
                    <td class="center days {{ $product->days_idle >= 90 ? 'days-critical' : ($product->days_idle >= 60 ? 'days-stagnant' : 'days-attention') }}">{{ $product->days_idle }}</td>
                    <td class="numeric">{{ $qty($product->stock) }}</td>
                    <td class="numeric">${{ number_format((float) $product->precio, 2) }}</td>
                    <td class="numeric">${{ number_format((float) $product->inventory_value, 2) }}</td>
                    <td class="numeric">{{ $qty($product->sold_90d) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" style="text-align:center; color:#a8a29e; padding: 16px;">Ningún producto lleva {{ $section['days'] }} días o más sin movimiento</td>
                </tr>
            @endforelse
        </tbody>
        @if ($section['products']->isNotEmpty())
            <tfoot>
                <tr>
                    <td colspan="7">
                        Total listado ({{ $section['products']->count() }} productos)
                        @if ($section['hiddenCount'] > 0)
                            · y {{ $section['hiddenCount'] }} más (ver Estadísticas)
                        @endif
                    </td>
                    <td class="numeric">${{ number_format($section['listedValue'], 2) }}</td>
                    <td></td>
                </tr>
            </tfoot>
        @endif
    </table>

    <p class="note">
        Días sin movimiento: desde la última venta, el último ingreso de stock o el alta del producto (lo más reciente).
        El valor estancado es stock × precio de venta; no incluye el costo de compra. Esta sección es un estado de hoy y no
        depende del periodo del reporte.
    </p>
</div>

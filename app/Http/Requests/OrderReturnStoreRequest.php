<?php

namespace App\Http\Requests;

use App\Enums\OrderStatusEnum;
use App\Enums\ReturnReasonEnum;
use App\Models\BusinessConfigModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OrderReturnStoreRequest extends FormRequest
{
    // Tope de líneas por devolución: una venta real no llega ni cerca, evita requests absurdos.
    private const MAX_ITEMS = 100;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', Rule::enum(ReturnReasonEnum::class)],
            'note' => ['nullable', 'string', 'max:255'],
            // Falso = devolución solo de stock, sin devolver dinero (corrección de inventario).
            'refund' => ['nullable', 'boolean'],
            // Método con el que se devuelve el dinero; sin él se usa el de la venta. Debe estar activo (los métodos de pago son globales).
            'refund_payment_method_id' => ['nullable', 'integer', Rule::exists('payment_methods', 'id')->where('active', true)],
            'items' => ['required', 'array', 'min:1', 'max:'.self::MAX_ITEMS],
            'items.*.order_product_id' => ['required', 'integer', 'distinct'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Selecciona el motivo de la devolución.',
            'reason.enum' => 'El motivo de la devolución no es válido.',
            'note.max' => 'La nota no puede superar los 255 caracteres.',
            'refund_payment_method_id.exists' => 'El método de reembolso no es válido.',
            'items.required' => 'Selecciona al menos un producto a devolver.',
            'items.min' => 'Selecciona al menos un producto a devolver.',
            'items.max' => 'Una devolución no puede incluir más de '.self::MAX_ITEMS.' productos.',
            'items.*.order_product_id.distinct' => 'Un producto no puede repetirse en la misma devolución.',
            'items.*.quantity.required' => 'La cantidad a devolver es requerida.',
            'items.*.quantity.numeric' => 'La cantidad a devolver debe ser un número válido.',
            'items.*.quantity.min' => 'La cantidad a devolver debe ser mayor a cero.',
        ];
    }

    public function refunds(): bool
    {
        return $this->boolean('refund', true);
    }

    /**
     * Plazo de devolución configurado por el negocio (0 = sin límite), contado desde que se concretó la
     * venta. Aplica a todos los roles, también al Admin: para quitar el límite se pone en 0.
     */
    private function returnWindowError(OrderModel $order): ?string
    {
        $days = (int) BusinessConfigModel::find(app('tenant_id'))?->return_days;
        if ($days <= 0) {
            return null;
        }

        $soldAt = $order->closed_at ?? $order->updated_at;

        return $soldAt->lt(now()->subDays($days)) ? "El plazo de devolución de {$days} días ya venció." : null;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $order = $this->route('order');
            if (! $order instanceof OrderModel) {
                $order = OrderModel::find($order);
            }

            if (! $order) {
                $validator->errors()->add('order', 'La orden no existe.');

                return;
            }

            if ((int) $order->estatus_pedido_id !== OrderStatusEnum::CLOSED->value) {
                $validator->errors()->add('order', 'Solo se pueden devolver productos de órdenes ya cerradas.');

                return;
            }

            if ($message = $this->returnWindowError($order)) {
                $validator->errors()->add('order', $message);

                return;
            }

            $items = $this->input('items', []);
            $lines = OrderProductModel::where(OrderProductModel::PEDIDO_ID, $order->id)
                ->whereIn('id', array_column($items, 'order_product_id'))
                ->whereNotNull(OrderProductModel::PRODUCTO_ID)
                ->get()
                ->keyBy('id');
            $products = ProductModel::whereIn('id', $lines->pluck(OrderProductModel::PRODUCTO_ID))->get()->keyBy('id');

            foreach ($items as $index => $item) {
                $line = $lines->get((int) $item['order_product_id']);

                if (! $line) {
                    $validator->errors()->add("items.{$index}.order_product_id", 'La orden no contiene este producto.');

                    continue;
                }

                // Un producto por unidad se cuenta en piezas enteras — mismo criterio que la
                // importación por CSV (ProductImportService) y el ajuste de stock.
                $quantity = (float) $item['quantity'];
                $unit = $products->get($line->producto_id)?->unidad_medida;
                if ($unit && ! $unit->esPeso() && floor($quantity) !== $quantity) {
                    $validator->errors()->add("items.{$index}.quantity", 'Los productos por unidad no aceptan cantidades decimales.');
                }
            }
        });
    }
}

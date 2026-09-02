<?php

namespace App\Http\Requests;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\CustomerModel;
use App\Models\OrderModel;
use App\Services\RolePermissionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class OrderUpdateRequest extends FormRequest
{
    /**
     * update() atiende varias intenciones distintas del frontend con el mismo endpoint
     * (editar descuento/domicilio mientras se toma el pedido, renombrar, cerrar/cobrar,
     * marcar servida) — un solo permission:xxx en la ruta sería incorrecto, así que se
     * autoriza aquí por campo. Admin siempre pasa (igual que PermissionMiddleware).
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }
        if ($user->rol_id === RoleEnum::ADMIN->value) {
            return true;
        }

        $granted = app(RolePermissionService::class)->grantedKeys($user->rol_id);

        // Sin ningún permiso relacionado a órdenes, no hay ninguna intención legítima de
        // este endpoint que aplique.
        if (array_intersect(['takeOrder', 'payOrder', 'kitchenView', 'editOrderName'], $granted) === []) {
            return false;
        }

        if ($this->filled(OrderModel::NOMBRE_PEDIDO) && ! in_array('editOrderName', $granted, true)) {
            return false;
        }

        if ($this->has(OrderModel::ESTATUS_PEDIDO_ID)) {
            $status = (int) $this->input(OrderModel::ESTATUS_PEDIDO_ID);

            if ($status === OrderStatusEnum::CLOSED->value && ! in_array('payOrder', $granted, true)) {
                return false;
            }
            if ($status === OrderStatusEnum::SERVED->value && ! in_array('kitchenView', $granted, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        return [
            OrderModel::DESCUENTO => 'numeric|min:0|max:99',
            OrderModel::NOMBRE_PEDIDO => 'nullable|string|max:255',
            OrderModel::ESTATUS_PEDIDO_ID => 'exists:order_status,id',
            OrderModel::PAYMENT_METHOD_ID => 'nullable|exists:payment_methods,id',
            OrderModel::PROPINA => 'nullable|numeric|min:0',
            OrderModel::COSTO_DOMICILIO => 'sometimes|nullable|numeric',
            OrderModel::IS_DELIVERY => 'sometimes|boolean',
            OrderModel::IS_CREDIT => 'sometimes|boolean',
            OrderModel::CUSTOMER_ID => [
                'nullable',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
                'required_if:'.OrderModel::IS_CREDIT.',true',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->boolean(OrderModel::IS_CREDIT) && $this->filled(OrderModel::CUSTOMER_ID)) {
                $customer = CustomerModel::find($this->input(OrderModel::CUSTOMER_ID));
                if (! $customer || ! $customer->allow_credit) {
                    $validator->errors()->add(OrderModel::CUSTOMER_ID, 'Este cliente no tiene crédito habilitado.');
                }
            }

            // Cerrar (cobrar) una orden retomada contra una caja que ya se cerró dejaría
            // una venta huérfana fuera de cualquier sesión activa, rompiendo el cuadre de
            // caja — solo se valida al intentar cerrar, no en ediciones menores en curso.
            $becomingClosed = (int) $this->input(OrderModel::ESTATUS_PEDIDO_ID) === OrderStatusEnum::CLOSED->value;
            if ($becomingClosed) {
                $order = $this->route('order');
                if ($order instanceof OrderModel && $order->sistema && $order->sistema->estatus_caja !== MainOrderStatusEnum::OPEN->value) {
                    $validator->errors()->add('sistema_id', 'La caja de esta venta ya está cerrada.');
                }
            }
        });
    }
}

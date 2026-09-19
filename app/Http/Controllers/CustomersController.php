<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\CustomerChargeStoreRequest;
use App\Http\Requests\CustomerPaymentStoreRequest;
use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use App\Models\CustomerChargeModel;
use App\Models\CustomerModel;
use App\Models\CustomerPaymentModel;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class CustomersController extends Controller
{
    public function index(IndexData $data, CustomerService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function list(): JsonResponse
    {
        $customers = CustomerModel::select('id', 'name', 'phone', 'allow_credit', 'balance')
            ->orderBy('name')
            ->get();

        return Response::success($customers);
    }

    public function store(CustomerStoreRequest $params): JsonResponse
    {
        $customer = CustomerModel::create([
            CustomerModel::NAME => $params->name,
            CustomerModel::PHONE => $params->phone,
            CustomerModel::NOTES => $params->notes,
            CustomerModel::ADDRESS => $params->address,
            CustomerModel::DELIVERY_REFERENCE => $params->delivery_reference,
            CustomerModel::ALLOW_CREDIT => $params->boolean('allow_credit', true),
        ]);

        // Adeudo inicial opcional, en la misma petición — mismo criterio de negocio que
        // registerCharge() (alta de deuda previa al sistema), aquí para clientes nuevos.
        if ($params->filled('initial_charge_amount')) {
            $this->applyCharge($customer, (float) $params->input('initial_charge_amount'), $params->input('initial_charge_note'));
        }

        return Response::success($customer->fresh());
    }

    public function show(CustomerModel $customer): JsonResponse
    {
        return Response::success($customer->load(['creditOrders', 'payments', 'charges']));
    }

    public function update(CustomerModel $customer, CustomerUpdateRequest $params): JsonResponse
    {
        $customer->update([
            CustomerModel::NAME => $params->name,
            CustomerModel::PHONE => $params->phone,
            CustomerModel::NOTES => $params->notes,
            CustomerModel::ADDRESS => $params->address,
            CustomerModel::DELIVERY_REFERENCE => $params->delivery_reference,
        ]);

        return Response::success($customer);
    }

    public function toggleCredit(CustomerModel $customer): JsonResponse
    {
        $customer->update([
            CustomerModel::ALLOW_CREDIT => ! $customer->allow_credit,
        ]);

        return Response::success($customer);
    }

    public function delete(CustomerModel $customer): JsonResponse
    {
        return Response::success($customer->delete());
    }

    public function registerPayment(CustomerModel $customer, CustomerPaymentStoreRequest $params): JsonResponse
    {
        $locked = CustomerModel::where('id', $customer->id)->lockForUpdate()->first();

        $payment = CustomerPaymentModel::create([
            CustomerPaymentModel::CUSTOMER_ID => $locked->id,
            CustomerPaymentModel::AMOUNT => $params->amount,
            CustomerPaymentModel::CREATED_BY => auth()->id(),
            CustomerPaymentModel::NOTE => $params->note,
        ]);

        $locked->decrement('balance', $params->amount);

        return Response::success($payment->load('customer'));
    }

    /**
     * Cargo manual — para dar de alta el adeudo que un cliente ya traía antes de empezar a
     * usar el sistema. No hay una orden real detrás, es un ajuste administrativo puro; a
     * diferencia de registerPayment() no tiene tope superior (un cargo no está limitado por
     * el balance actual).
     */
    public function registerCharge(CustomerModel $customer, CustomerChargeStoreRequest $params): JsonResponse
    {
        $charge = $this->applyCharge($customer, (float) $params->amount, $params->note);

        return Response::success($charge->load('customer'));
    }

    /**
     * Crea el registro de cargo y suma el monto al balance del cliente — compartido entre
     * registerCharge() (cliente existente, desde el detalle) y store() (adeudo inicial
     * opcional al dar de alta un cliente nuevo).
     */
    private function applyCharge(CustomerModel $customer, float $amount, ?string $note): CustomerChargeModel
    {
        $locked = CustomerModel::where('id', $customer->id)->lockForUpdate()->first();

        $charge = CustomerChargeModel::create([
            CustomerChargeModel::CUSTOMER_ID => $locked->id,
            CustomerChargeModel::AMOUNT => $amount,
            CustomerChargeModel::CREATED_BY => auth()->id(),
            CustomerChargeModel::NOTE => $note,
        ]);

        $locked->increment('balance', $amount);

        return $charge;
    }
}

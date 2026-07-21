<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\CustomerPaymentStoreRequest;
use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use App\Models\CustomerModel;
use App\Models\CustomerPaymentModel;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
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

        return Response::success($customer);
    }

    public function show(CustomerModel $customer): JsonResponse
    {
        return Response::success($customer->load(['creditOrders', 'payments']));
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
        $payment = DB::transaction(function () use ($customer, $params) {
            $locked = CustomerModel::where('id', $customer->id)->lockForUpdate()->first();

            $payment = CustomerPaymentModel::create([
                CustomerPaymentModel::CUSTOMER_ID => $locked->id,
                CustomerPaymentModel::AMOUNT => $params->amount,
                CustomerPaymentModel::CREATED_BY => auth()->id(),
                CustomerPaymentModel::NOTE => $params->note,
            ]);

            $locked->decrement('balance', $params->amount);

            return $payment;
        });

        return Response::success($payment->load('customer'));
    }
}

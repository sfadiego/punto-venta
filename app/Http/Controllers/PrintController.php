<?php

namespace App\Http\Controllers;

use App\Models\OrderModel;
use App\Models\OrderReturnModel;
use App\Printer\Connectors\BufferConnector;
use App\Printer\Data\LayawayTicketData;
use App\Printer\Data\ReturnTicketData;
use App\Printer\Data\TestTicketData;
use App\Printer\Data\VentaTicketData;
use App\Printer\Dto\TicketDataInterface;
use App\Printer\Factory\PrinterServiceFactory;
use App\Printer\Formatters\LayawayFormatter;
use App\Printer\Formatters\ReturnFormatter;
use App\Printer\Formatters\TestTicketFormatter;
use App\Printer\Formatters\VentaFormatter;
use App\Printer\Interface\TicketFormatterInterface;
use App\Printer\Service\PrinterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Throwable;

class PrintController extends Controller
{
    public function print(OrderModel $order, Request $request)
    {
        try {
            $tenant = $request->user()->tenant;
            [$formatter, $ticketData] = $this->ticketFor($order);
            $service = PrinterServiceFactory::make($formatter, $tenant);
            $service->printTicket($ticketData);

            return Response::success($order, 'Impresión enviada');
        } catch (Throwable $th) {
            return $this->printFailure($th, 'print');
        }
    }

    /** Imprime en el servidor el comprobante de una devolución de la orden (ruta de impresión CUPS/red). */
    public function printReturn(OrderModel $order, OrderReturnModel $orderReturn, Request $request)
    {
        try {
            $tenant = $request->user()->tenant;
            $service = PrinterServiceFactory::make(new ReturnFormatter, $tenant);
            $service->printTicket(new ReturnTicketData($orderReturn));

            return Response::success($orderReturn, 'Impresión enviada');
        } catch (Throwable $th) {
            return $this->printFailure($th, 'print-return');
        }
    }

    /** Bytes ESC/POS del comprobante de devolución, para el agente local o la impresora Bluetooth. */
    public function returnRawBytes(OrderModel $order, OrderReturnModel $orderReturn, Request $request)
    {
        try {
            $connector = new BufferConnector($request->user()->tenant);
            $service = new PrinterService($connector, new ReturnFormatter);
            $service->printTicket(new ReturnTicketData($orderReturn));

            $bytes = $connector->getBytes();

            return response($bytes, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Length' => strlen($bytes),
            ]);
        } catch (Throwable $th) {
            return $this->printFailure($th, 'return-raw-bytes');
        }
    }

    /**
     * Genera un ticket de prueba ESC/POS y retorna los bytes crudos.
     */
    public function testBytes(Request $request)
    {
        try {
            $tenant = $request->user()->tenant;
            $connector = new BufferConnector($tenant);
            $service = new PrinterService($connector, new TestTicketFormatter);
            $service->printTicket(new TestTicketData($tenant));

            $bytes = $connector->getBytes();

            return response($bytes, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Length' => strlen($bytes),
            ]);
        } catch (Throwable $th) {
            return $this->printFailure($th, 'test-bytes');
        }
    }

    /**
     * Genera el ticket ESC/POS y retorna los bytes crudos para que el
     * agente local WebSocket los envíe directamente a la impresora USB.
     */
    public function rawBytes(OrderModel $order, Request $request)
    {
        try {
            $tenant = $request->user()->tenant;
            [$formatter, $ticketData] = $this->ticketFor($order);
            $connector = new BufferConnector($tenant);
            $service = new PrinterService($connector, $formatter);
            $service->printTicket($ticketData);

            $bytes = $connector->getBytes();

            return response($bytes, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Length' => strlen($bytes),
            ]);
        } catch (Throwable $th) {
            return $this->printFailure($th, 'raw-bytes');
        }
    }

    /**
     * Una orden que pasó por un apartado (activo, liquidado o cancelado) imprime el comprobante de
     * apartado — abonos y saldo incluidos —; cualquier otra, el ticket de venta normal.
     *
     * @return array{0: TicketFormatterInterface, 1: TicketDataInterface}
     */
    private function ticketFor(OrderModel $order): array
    {
        if ($order->layawayPayments()->exists()) {
            return [new LayawayFormatter, new LayawayTicketData($order)];
        }

        return [new VentaFormatter, new VentaTicketData($order)];
    }

    /**
     * Un \Throwable de impresión puede traer detalles internos (rutas de archivo, errores
     * de conexión SMB, etc.) que no deben llegar al cliente — se loguea completo y se
     * responde un mensaje genérico.
     */
    private function printFailure(Throwable $th, string $context): JsonResponse
    {
        Log::error("Error al imprimir ({$context})", [
            'message' => $th->getMessage(),
            'trace' => $th->getTraceAsString(),
        ]);

        return Response::error('No se pudo imprimir el ticket, intenta de nuevo.');
    }
}

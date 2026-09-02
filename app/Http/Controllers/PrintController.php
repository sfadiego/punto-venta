<?php

namespace App\Http\Controllers;

use App\Models\OrderModel;
use App\Printer\Connectors\BufferConnector;
use App\Printer\Data\TestTicketData;
use App\Printer\Data\VentaTicketData;
use App\Printer\Factory\PrinterServiceFactory;
use App\Printer\Formatters\TestTicketFormatter;
use App\Printer\Formatters\VentaFormatter;
use App\Printer\Service\PrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class PrintController extends Controller
{
    public function print(OrderModel $order, Request $request)
    {
        try {
            $tenant = $request->user()->tenant;
            $service = PrinterServiceFactory::make(new VentaFormatter, $tenant);
            $service->printTicket(new VentaTicketData($order));

            return Response::success($order, 'Impresión enviada');
        } catch (\Throwable $th) {
            return Response::error($th->getMessage());
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
        } catch (\Throwable $th) {
            return Response::error($th->getMessage());
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
            $connector = new BufferConnector($tenant);
            $service = new PrinterService($connector, new VentaFormatter);
            $service->printTicket(new VentaTicketData($order));

            $bytes = $connector->getBytes();

            return response($bytes, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Length' => strlen($bytes),
            ]);
        } catch (\Throwable $th) {
            return Response::error($th->getMessage());
        }
    }
}

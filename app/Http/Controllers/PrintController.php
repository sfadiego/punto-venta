<?php

namespace App\Http\Controllers;

use App\Models\OrderModel;
use App\Printer\Connectors\BufferConnector;
use App\Printer\Data\VentaTicketData;
use App\Printer\Factory\PrinterServiceFactory;
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

            $connector->init();
            $p = $connector->getPrinter();
            $p->initialize();

            $line = str_repeat('=', 32);
            $dline = str_repeat('-', 32);
            $now = now()->setTimezone(config('app.timezone'));

            $p->setJustification(\Mike42\Escpos\Printer::JUSTIFY_CENTER);
            $p->setEmphasis(true);
            $p->setTextSize(1, 2);
            $p->text("PRUEBA DE IMPRESION\n");
            $p->setTextSize(1, 1);
            $p->setEmphasis(false);
            $p->text($line."\n");

            $p->setJustification(\Mike42\Escpos\Printer::JUSTIFY_LEFT);
            $p->text('Negocio : '.($tenant->business_name ?? 'POS')."\n");
            $p->text('Fecha   : '.$now->format('d/m/Y H:i:s')."\n");
            $p->text($dline."\n");

            $p->setJustification(\Mike42\Escpos\Printer::JUSTIFY_CENTER);
            $p->setEmphasis(true);
            $p->text("Agente de impresion: OK\n");
            $p->setEmphasis(false);
            $p->text("Sistema POS\n");
            $p->text($line."\n");
            $p->feed(4);
            $p->cut();

            $connector->close();

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

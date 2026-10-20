<?php

namespace App\Http\Controllers;

use App\Models\ProductModel;
use App\Services\ProductBarcodeImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Response;
use Picqer\Barcode\Exceptions\BarcodeException;

class ProductBarcodeImageController extends Controller
{
    public function __construct(private readonly ProductBarcodeImageService $service) {}

    /** download — descarga el código de barras del producto como imagen PNG (barras y código debajo). */
    public function download(ProductModel $product): JsonResponse|HttpResponse
    {
        $code = $product->barcodeValue();

        try {
            $png = $this->service->png($code);
        } catch (BarcodeException) {
            return Response::error('El código de este producto no se puede convertir a código de barras: solo admite letras sin acento, números y símbolos comunes.');
        }

        // El código lo capturó el usuario: se limpia para que sea un nombre de archivo seguro.
        $safeCode = preg_replace('/[^A-Za-z0-9_-]/', '', $code) ?: (string) $product->id;

        return response($png, 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => "attachment; filename=\"codigo-de-barras-{$safeCode}.png\"",
        ]);
    }
}

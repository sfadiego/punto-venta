<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\UnidadMedidaEnum;
use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use App\Services\ProductsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class ProductController extends Controller
{
    public function index(IndexData $data, ProductsService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function show(ProductModel $product): JsonResponse
    {
        return Response::success($product->load('picture'));
    }

    public function store(ProductStoreRequest $param): JsonResponse
    {
        return Response::success(
            ProductModel::create([
                ProductModel::NOMBRE       => $param->nombre,
                ProductModel::PRECIO       => $param->precio,
                ProductModel::DESCRIPCION  => $param->descripcion ?? '',
                ProductModel::CATEGORIA_ID => $param->categoria_id,
                ProductModel::FOTO_ID      => $param?->picture_id ?? null,
                ProductModel::UNIDAD_MEDIDA => $param->unidad_medida ?? UnidadMedidaEnum::Unidad->value,
            ])
        );
    }

    public function update(ProductModel $product, ProductUpdateRequest $param): JsonResponse
    {
        return Response::success(
            $product->updateProduct(
                nombre: $param->has('nombre') ? $param->nombre : null,
                precio: $param->has('precio') ? $param->precio : null,
                descripcion: $param->has('descripcion') ? $param->descripcion : null,
                categoriaId: $param->has('categoria_id') ? $param->categoria_id : null,
                pictureId: $param->has('picture_id') ? $param->picture_id : null,
                active: $param->has('activo') ? (bool) $param->activo : null,
                unidadMedida: $param->has('unidad_medida') ? $param->unidad_medida : null,
            )
        );
    }

    public function delete(ProductModel $product): JsonResponse
    {
        if (! $product->count()) {
            return Response::error('Producto invalido');
        }

        $picture = $product->picture;
        $product->delete();

        if ($picture) {
            ProductImageModel::deleteFile($picture->nombre_archivo);
            $picture->delete();
        }

        return Response::success(true);
    }
}

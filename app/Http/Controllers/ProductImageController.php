<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductImageStoreRequest;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use Illuminate\Support\Facades\Response;

class ProductImageController extends Controller
{
    public function store(ProductModel $product, ProductImageStoreRequest $param): ProductModel
    {
        $slug = $param->user()->tenant->slug;
        $upload = ProductImageModel::processImage($param->file('file'), $slug);
        if (! $upload) {
            return Response::error('No se puede subir la imagen');
        }

        $picture = ProductImageModel::create([
            ProductImageModel::NOMBRE_ARCHIVO => $upload['nombre_archivo'],
            ProductImageModel::URL => $upload['url'],
        ]);
        $product->foto_id = $picture->id;
        $product->save();

        return $product->load('picture');
    }

    public function update(
        ProductModel $product,
        ProductImageModel $image,
        ProductImageStoreRequest $param,
    ): ProductModel {
        $slug = $param->user()->tenant->slug;
        $upload = ProductImageModel::processImage($param->file('file'), $slug);
        if (! $upload) {
            return Response::error('No se puede subir la imagen');
        }

        ProductImageModel::deleteFile($image->nombre_archivo);

        $image->nombre_archivo = $upload['nombre_archivo'];
        $image->url = $upload['url'];
        $image->save();

        return $product->load('picture');
    }
}

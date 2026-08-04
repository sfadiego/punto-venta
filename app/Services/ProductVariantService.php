<?php

namespace App\Services;

use App\Http\Requests\ProductVariantStoreRequest;
use App\Http\Requests\ProductVariantUpdateRequest;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;

class ProductVariantService
{
    public function create(ProductModel $product, ProductVariantStoreRequest $params): ProductVariantModel
    {
        return ProductVariantModel::create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            ProductVariantModel::NOMBRE => $params->nombre,
            ProductVariantModel::PRECIO => $params->precio,
            ProductVariantModel::ORDEN => $params->orden ?? 0,
            ProductVariantModel::ACTIVO => $params->has('activo') ? (bool) $params->activo : true,
        ]);
    }

    public function update(ProductVariantModel $variant, ProductVariantUpdateRequest $params): ProductVariantModel
    {
        $data = [];

        if ($params->has('nombre')) {
            $data[ProductVariantModel::NOMBRE] = $params->nombre;
        }
        if ($params->has('precio')) {
            $data[ProductVariantModel::PRECIO] = $params->precio;
        }
        if ($params->has('orden')) {
            $data[ProductVariantModel::ORDEN] = $params->orden;
        }
        if ($params->has('activo')) {
            $data[ProductVariantModel::ACTIVO] = (bool) $params->activo;
        }

        $variant->update($data);

        return $variant->refresh();
    }

    public function delete(ProductVariantModel $variant): bool
    {
        return $variant->delete();
    }
}

<?php

namespace App\Services;

use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\ProductImageModel;
use App\Models\ProductModel;
use App\Models\ProviderModel;
use Illuminate\Support\Facades\DB;

class TenantDemoDataService
{
    /**
     * Limpia las órdenes de demo de un tenant. Si $deepClean es true, además borra
     * catálogo completo (categorías, productos, clientes, proveedores). El orden de
     * borrado respeta las FK RESTRICT: order_product -> order -> main_order_report,
     * luego product (antes que categories, por categoria_id) y sus product_image,
     * luego categories y sus product_image. customers/providers no tienen FK entrante
     * desde order/product que bloquee, así que pueden borrarse en cualquier momento.
     */
    public function clear(int $tenantId, bool $deepClean = false): void
    {
        $orderIds = DB::table('order')
            ->where('tenant_id', $tenantId)
            ->pluck('id');

        if ($orderIds->isNotEmpty()) {
            DB::table('order_product')->whereIn('pedido_id', $orderIds)->delete();
            DB::table('order')->where('tenant_id', $tenantId)->delete();
        }

        DB::table('main_order_report')->where('tenant_id', $tenantId)->delete();

        if (! $deepClean) {
            return;
        }

        $this->clearProducts($tenantId);
        $this->clearCategories($tenantId);

        CustomerModel::withTrashed()->where(CustomerModel::TENANT_ID, $tenantId)->forceDelete();
        ProviderModel::withTrashed()->where(ProviderModel::TENANT_ID, $tenantId)->forceDelete();
    }

    private function clearProducts(int $tenantId): void
    {
        $fotoIds = ProductModel::withTrashed()
            ->where(ProductModel::TENANT_ID, $tenantId)
            ->whereNotNull(ProductModel::FOTO_ID)
            ->pluck(ProductModel::FOTO_ID);

        ProductModel::withTrashed()->where(ProductModel::TENANT_ID, $tenantId)->forceDelete();

        $this->clearProductImages($tenantId, $fotoIds);
    }

    private function clearCategories(int $tenantId): void
    {
        $fotoIds = CategoryModel::withTrashed()
            ->where(CategoryModel::TENANT_ID, $tenantId)
            ->whereNotNull(CategoryModel::FOTO_ID)
            ->pluck(CategoryModel::FOTO_ID);

        CategoryModel::withTrashed()->where(CategoryModel::TENANT_ID, $tenantId)->forceDelete();

        $this->clearProductImages($tenantId, $fotoIds);
    }

    private function clearProductImages(int $tenantId, $fotoIds): void
    {
        if ($fotoIds->isEmpty()) {
            return;
        }

        $images = ProductImageModel::where(ProductImageModel::TENANT_ID, $tenantId)
            ->whereIn('id', $fotoIds)
            ->get();

        foreach ($images as $image) {
            ProductImageModel::deleteFile($image->nombre_archivo);
        }

        ProductImageModel::where(ProductImageModel::TENANT_ID, $tenantId)->whereIn('id', $fotoIds)->delete();
    }
}

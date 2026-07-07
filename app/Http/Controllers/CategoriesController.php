<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\CategoryStoreRequest;
use App\Http\Requests\CategoryUpdateRequest;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Response;

class CategoriesController extends Controller
{
    public function index(IndexData $data, CategoryService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function store(CategoryStoreRequest $param): JsonResponse
    {
        $category = CategoryModel::create([
            CategoryModel::NOMBRE => $param->nombre,
            CategoryModel::ORDEN => $param->orden ?? 1,
            CategoryModel::ICON_NAME => $param->icon_name ?? '',
        ]);

        $this->forgetListCache();

        return Response::success($category);
    }

    public function show(CategoryModel $category): JsonResponse
    {
        return Response::success($category);
    }

    public function update(CategoryModel $category, CategoryUpdateRequest $param): JsonResponse
    {
        $category->update([
            CategoryModel::NOMBRE => $param->nombre,
            CategoryModel::ORDEN => $param->orden,
            CategoryModel::ICON_NAME => $param->icon_name ?? '',
        ]);

        $this->forgetListCache();

        return Response::success($category);
    }

    public function delete(CategoryModel $category): JsonResponse
    {
        $result = $category->delete();

        $this->forgetListCache();

        return Response::success($result);
    }

    public function list(): JsonResponse
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : 0;

        $data = Cache::remember("categories_list_{$tenantId}", 600, fn () => CategoryModel::select('id', CategoryModel::NOMBRE, CategoryModel::ICON_NAME)
            ->orderBy(CategoryModel::ORDEN)
            ->get()
        );

        return Response::success($data);
    }

    public function categoryProduct(CategoryModel $category): JsonResponse
    {
        return Response::success(
            ProductModel::where(ProductModel::CATEGORIA_ID, $category->id)->get()
        );
    }

    private function forgetListCache(): void
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : 0;
        Cache::forget("categories_list_{$tenantId}");
    }
}

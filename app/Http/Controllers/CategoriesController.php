<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\CategoryStoreRequest;
use App\Http\Requests\CategoryUpdateRequest;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class CategoriesController extends Controller
{
    public function index(IndexData $data, CategoryService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function store(CategoryStoreRequest $param): JsonResponse
    {
        return Response::success(
            CategoryModel::create([
                CategoryModel::NOMBRE => $param->nombre,
                CategoryModel::ORDEN => $param->orden ?? 1,
                CategoryModel::ICON_NAME => $param->icon_name ?? '',
            ])
        );
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

        return Response::success($category);
    }

    public function delete(CategoryModel $category): JsonResponse
    {
        return Response::success($category->delete());
    }

    public function list(): JsonResponse
    {
        return Response::success(
            CategoryModel::select('id', CategoryModel::NOMBRE, CategoryModel::ICON_NAME)
                ->orderBy(CategoryModel::ORDEN)
                ->get()
        );
    }

    public function categoryProduct(CategoryModel $category): JsonResponse
    {
        return Response::success(
            ProductModel::where(ProductModel::CATEGORIA_ID, $category->id)->get()
        );
    }
}

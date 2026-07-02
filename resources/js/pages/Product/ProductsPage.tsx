import { useState, useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Package, Plus, RefreshCw } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { useProductsPage } from "./useProductsPage";
import { CategoryFilter } from "./partials/CategoryFilter";
import { AddProductModal } from "./partials/AddProductModal";
import { useAddProductModal } from "./partials/useAddProductModal";
import { EditProductModal } from "./partials/EditProductModal";
import { useEditProductModal } from "./partials/useEditProductModal";
import { ProductTableActions } from "./partials/ProductTableActions";

export default function ProductsPage() {
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

    const {
        products,
        total,
        page,
        limit,
        pageSize,
        isLoading,
        categories,
        categoryId,
        setPage,
        setLimit,
        refetch,
        handleCategoryChange,
        invalidateProducts,
    } = useProductsPage();

    const { isOpen: addOpen, openModal: openAdd, handleClose: closeAdd, formik: addFormik, categories: addCategories, sellByWeight } =
        useAddProductModal(invalidateProducts);

    const { formik: editFormik, categories: editCategories, sellByWeight: editSellByWeight } = useEditProductModal(
        editingProduct,
        invalidateProducts,
        () => setEditingProduct(null),
    );

    const columns = useMemo<DataTableColumn<IProduct>[]>(
        () => [
            {
                accessor: "picture",
                title: "",
                width: 52,
                render: (p: IProduct) =>
                    p.picture?.url ?? p.picture?.nombre_archivo ? (
                        <img
                            src={p.picture.url ?? `${ApiRoutes.Files}/${p.picture.nombre_archivo}`}
                            alt={p.nombre}
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                            <Package size={14} className="text-stone-400" />
                        </div>
                    ),
            },
            {
                accessor: "nombre",
                title: "Nombre",
                render: (p: IProduct) => (
                    <span className="font-medium text-stone-900 text-sm">{p.nombre}</span>
                ),
            },
            {
                accessor: "category",
                title: "Categoría",
                render: (p: IProduct) => (
                    <span className="text-stone-600 text-sm">{p.category?.nombre ?? "—"}</span>
                ),
            },
            {
                accessor: "precio",
                title: "Precio",
                render: (p: IProduct) => (
                    <span className="font-semibold text-stone-900 tabular-nums text-sm">
                        ${Number(p.precio).toFixed(2)}{" "}
                        <span className="text-xs font-normal text-stone-400">
                            / {UNIDAD_LABELS[p.unidad_medida]}
                        </span>
                    </span>
                ),
            },
            {
                accessor: "activo",
                title: "Estado",
                render: (p: IProduct) => (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.activo
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-stone-100 text-stone-500"
                        }`}
                    >
                        {p.activo ? "Activo" : "Inactivo"}
                    </span>
                ),
            },
            {
                accessor: "_acciones" as keyof IProduct,
                title: "Acciones",
                width: 90,
                textAlign: "center",
                render: (p: IProduct) => (
                    <ProductTableActions product={p} onEdit={setEditingProduct} />
                ),
            },
        ],
        [],
    );

    return (
        <div className="px-5 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "producto" : "productos"} en total
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                    >
                        <Plus size={16} />
                        Nuevo producto
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                {/* Filtro de categorías */}
                {categories.length > 0 && (
                    <div className="px-5 py-4 border-b border-stone-100">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                            Filtrar por categoría
                        </p>
                        <CategoryFilter
                            categories={categories}
                            selected={categoryId}
                            onChange={handleCategoryChange}
                        />
                    </div>
                )}

                {/* Tabla */}
                <div className="p-4">
                    <DataTable<IProduct>
                        columns={columns}
                        records={products}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No se encontraron productos"
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        striped
                        minHeight={300}
                        className="whitespace-nowrap"
                        paginationText={({ from, to, totalRecords }) =>
                            `Mostrando del ${from} al ${to} de ${totalRecords} registros`
                        }
                    />
                </div>
            </div>

            <AddProductModal
                isOpen={addOpen}
                formik={addFormik}
                categories={addCategories}
                sellByWeight={sellByWeight}
                onClose={closeAdd}
            />

            <EditProductModal
                isOpen={editingProduct !== null}
                product={editingProduct}
                formik={editFormik}
                categories={editCategories}
                sellByWeight={editSellByWeight}
                onClose={() => setEditingProduct(null)}
            />
        </div>
    );
}

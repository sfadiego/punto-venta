import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw } from "lucide-react";
import { ICategory } from "@/models/ICategory";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useCategoriesPage } from "./useCategoriesPage";
import { AddCategoryModal } from "./partials/CategoryModals/AddCategoryModal";
import { useAddCategoryModal } from "./partials/CategoryModals/useAddCategoryModal";
import { EditCategoryModal } from "./partials/CategoryModals/EditCategoryModal";
import { useEditCategoryModal } from "./partials/CategoryModals/useEditCategoryModal";
import { CategoryTableActions } from "./partials/CategoryTableActions";

export default function CategoriesPage() {
    const {
        categories,
        total,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        editingCategory,
        setEditingCategory,
        invalidateCategories,
    } = useCategoriesPage();

    const { isOpen: addOpen, openModal: openAdd, handleClose: closeAdd, formik: addFormik } =
        useAddCategoryModal(invalidateCategories);

    const { formik: editFormik } = useEditCategoryModal(
        editingCategory,
        invalidateCategories,
        () => setEditingCategory(null),
    );

    const columns = useMemo<DataTableColumn<ICategory>[]>(
        () => [
            {
                accessor: "icon_name",
                title: "Ícono",
                width: 68,
                render: (cat: ICategory) => (
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-100">
                        <DynamicIcon
                            name={cat.icon_name ?? "Tag"}
                            size={18}
                            className="text-amber-600"
                        />
                    </div>
                ),
            },
            {
                accessor: "nombre",
                title: "Nombre",
                render: (cat: ICategory) => (
                    <span className="font-medium text-stone-900 text-sm">{cat.nombre}</span>
                ),
            },
            {
                accessor: "orden",
                title: "Orden",
                width: 90,
                render: (cat: ICategory) => (
                    <span className="text-stone-500 text-sm tabular-nums">
                        {cat.orden ?? "—"}
                    </span>
                ),
            },
            {
                accessor: "_acciones" as keyof ICategory,
                title: "Acciones",
                width: 90,
                textAlign: "center",
                render: (cat: ICategory) => (
                    <CategoryTableActions category={cat} onEdit={setEditingCategory} />
                ),
            },
        ],
        [setEditingCategory],
    );

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Categorías</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "categoría" : "categorías"} registradas
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
                        Nueva categoría
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-4">
                    <DataTable<ICategory>
                        columns={columns}
                        records={categories}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No hay categorías registradas"
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        striped
                        minHeight={200}
                        className="whitespace-nowrap"
                        paginationText={({ from, to, totalRecords }) =>
                            `Mostrando del ${from} al ${to} de ${totalRecords} registros`
                        }
                    />
                </div>
            </div>

            <AddCategoryModal
                isOpen={addOpen}
                formik={addFormik}
                onClose={closeAdd}
            />

            <EditCategoryModal
                isOpen={editingCategory !== null}
                category={editingCategory}
                formik={editFormik}
                onClose={() => setEditingCategory(null)}
            />
        </div>
    );
}

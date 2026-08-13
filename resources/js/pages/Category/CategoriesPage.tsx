import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw } from "lucide-react";
import { ICategory } from "@/models/ICategory";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { CategorySearch } from "./partials/CategorySearch";
import { RoleEnum } from "@/enums/RoleEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { useCategoriesPage } from "./useCategoriesPage";
import { CategoryModal } from "./partials/CategoryModals/CategoryModal";
import { useCategoryModal } from "./partials/CategoryModals/useCategoryModal";
import { CategoryTableActions } from "./partials/CategoryTableActions";

export default function CategoriesPage() {
    const { hasRole } = usePermissions();
    const isAdmin = hasRole(RoleEnum.Admin);
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
        search,
        handleSearchChange,
        isModalOpen,
        editingCategory,
        openAddModal,
        openEditModal,
        handleCloseModal,
        invalidateCategories,
    } = useCategoriesPage();

    const { isEdit, formik } = useCategoryModal(editingCategory, total + 1, invalidateCategories, handleCloseModal);

    const columns = useMemo<DataTableColumn<ICategory>[]>(
        () => [
            {
                accessor: "icon_name",
                title: "Ícono",
                width: 68,
                render: (cat: ICategory) => (
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-100">
                        <CatalogIcon
                            iconName={cat.icon_name}
                            iconSource={cat.icon_source}
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
                    <CategoryTableActions category={cat} onEdit={openEditModal} />
                ),
            },
        ],
        [openEditModal],
    );

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Categorías</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "categoría" : "categorías"} registradas
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    {isAdmin && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                        >
                            <Plus size={16} />
                            Nueva categoría
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-4 pt-4">
                    <CategorySearch value={search} onChange={handleSearchChange} />
                </div>
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

            <CategoryModal
                isOpen={isModalOpen}
                isEdit={isEdit}
                formik={formik}
                onClose={handleCloseModal}
            />
        </div>
    );
}

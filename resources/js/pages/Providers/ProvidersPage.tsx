import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw, Search } from "lucide-react";
import { IProvider } from "@/models/IProvider";
import { Input } from "@/components/ui/form/Input";
import { useProvidersPage } from "./useProvidersPage";
import { ProviderModal } from "./partials/ProviderModals/ProviderModal";
import { useProviderModal } from "./partials/ProviderModals/useProviderModal";
import { ProviderTableActions } from "./partials/ProviderTableActions";

export default function ProvidersPage() {
    const {
        providers,
        total,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        search,
        setSearch,
        invalidateProviders,
    } = useProvidersPage();

    const {
        isOpen: modalOpen,
        isEditing,
        editingProvider,
        openCreateModal,
        openEditModal,
        handleClose: closeModal,
        formik,
    } = useProviderModal(invalidateProviders);

    const columns = useMemo<DataTableColumn<IProvider>[]>(
        () => [
            {
                accessor: "name",
                title: "Nombre",
                render: (provider: IProvider) => (
                    <div>
                        <span className="font-medium text-stone-900 text-sm">{provider.name}</span>
                        {provider.phone && (
                            <p className="text-xs text-stone-400 mt-0.5">{provider.phone}</p>
                        )}
                    </div>
                ),
            },
            {
                accessor: "contact_name",
                title: "Contacto",
                render: (provider: IProvider) => (
                    <span className="text-sm text-stone-600">{provider.contact_name || "—"}</span>
                ),
            },
            {
                accessor: "_acciones" as keyof IProvider,
                title: "Acciones",
                width: 120,
                textAlign: "center",
                render: (provider: IProvider) => (
                    <ProviderTableActions provider={provider} onEdit={openEditModal} />
                ),
            },
        ],
        [openEditModal],
    );

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Proveedores</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "proveedor registrado" : "proveedores registrados"}
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
                        onClick={openCreateModal}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                    >
                        <Plus size={16} />
                        Nuevo proveedor
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 z-10" />
                    <Input
                        name="search"
                        inputType="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o teléfono..."
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-4">
                    <DataTable<IProvider>
                        columns={columns}
                        records={providers}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No hay proveedores registrados"
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

            <ProviderModal
                isOpen={modalOpen}
                isEditing={isEditing}
                provider={editingProvider}
                formik={formik}
                onClose={closeModal}
            />
        </div>
    );
}

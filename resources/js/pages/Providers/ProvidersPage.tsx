import { useMemo } from "react";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw } from "lucide-react";
import { IProvider } from "@/models/IProvider";
import { SearchInput } from "@/components/ui/form/SearchInput";
import { useProvidersPage } from "./useProvidersPage";
import { SelectProviderActiveFilter } from "./partials/SelectProviderActiveFilter";
import { ProviderModal } from "./partials/ProviderModals/ProviderModal";
import { useProviderModal } from "./partials/ProviderModals/useProviderModal";
import { ProviderTableActions } from "./partials/ProviderTableActions";

export default function ProvidersPage() {
    const {
        tableProps,
        total,
        refetch,
        search,
        setSearch,
        active,
        setActive,
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
                accessor: "active",
                title: "Estado",
                render: (provider: IProvider) => (
                    <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${provider.active ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"
                        }`}
                    >
                        {provider.active ? "Activo" : "Oculto"}
                    </span>
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
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar por nombre o teléfono..."
                    className="flex-1 min-w-[200px]"
                />
                <div className="w-full sm:w-48">
                    <SelectProviderActiveFilter value={active} onChange={setActive} />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-4">
                    <CustomDataTable<IProvider>
                        columns={columns}
                        {...tableProps}
                        fetchingText="Cargando proveedores..."
                        noRecordsText="No hay proveedores registrados"
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

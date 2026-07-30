import { Plus, RefreshCw, Search } from "lucide-react";
import { UsersTable } from "@/components/Users/UsersTable";
import { EditUserModal } from "@/components/Users/EditUserModal";
import { CreateUserModal } from "@/components/Users/CreateUserModal";
import { RoleEnum } from "@/enums/RoleEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { useUsersPage } from "./useUsersPage";

export default function UsersPage() {
    const { hasRole } = usePermissions();
    const isAdmin = hasRole(RoleEnum.Admin);
    const {
        users,
        total,
        maxUsers,
        atUserLimit,
        page,
        limit,
        pageSize,
        search,
        isLoading,
        refetch,
        setPage,
        setLimit,
        setSearch,
        editingUser,
        setEditingUser,
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        excludeRoles,
    } = useUsersPage();

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Usuarios</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "usuario" : "usuarios"} registrados
                        {maxUsers !== null && ` de ${maxUsers} permitidos`}
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
                    {isAdmin && !atUserLimit && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 text-sm font-medium text-white bg-amber-500 px-3 py-2 rounded-xl hover:bg-amber-600 transition-colors"
                        >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Nuevo usuario</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stone-100">
                    <div className="relative max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Buscar usuario..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        />
                    </div>
                </div>
                <div className="p-4">
                    <UsersTable
                        users={users}
                        total={total}
                        page={page}
                        limit={limit}
                        pageSize={pageSize}
                        isLoading={isLoading}
                        onEdit={setEditingUser}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            </div>

            <EditUserModal
                user={editingUser}
                excludeRoles={excludeRoles}
                onClose={() => setEditingUser(null)}
            />

            <CreateUserModal
                open={isCreateModalOpen}
                excludeRoles={excludeRoles}
                onClose={closeCreateModal}
            />
        </div>
    );
}

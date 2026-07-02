import { ChevronLeft, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { UserTable } from "@/components/SuperAdmin/TenantUsers/UserTable";
import { UserModal } from "@/components/SuperAdmin/TenantUsers/UserModal";
import { SeedUsersButton } from "@/components/SuperAdmin/TenantUsers/SeedUsersButton";
import { useTenantUsers } from "./useTenantUsers";

export default function TenantUsersPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const tenantId = Number(id);

    const {
        users,
        isLoading,
        tenantSlug,
        tipoNegocio,
        modalUser,
        isModalOpen,
        openCreate,
        openEdit,
        closeModal,
        handleDelete,
    } = useTenantUsers(tenantId);

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() =>
                                navigate(SuperAdminRoutes.EditTenant.replace(":id", String(tenantId)))
                            }
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Gestión de usuarios del cliente</p>
                        </div>
                    </div>
                    <SeedUsersButton tenantId={tenantId} />
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                        <Plus size={16} />
                        Nuevo usuario
                    </button>
                </div>

                <UserTable
                    users={users}
                    isLoading={isLoading}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            </div>

            {isModalOpen && (
                <UserModal
                    tenantId={tenantId}
                    tenantSlug={tenantSlug}
                    tipoNegocio={tipoNegocio}
                    user={modalUser ?? null}
                    onClose={closeModal}
                />
            )}
        </SuperAdminLayout>
    );
}

import { ChevronLeft, Loader, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantForm } from "./useTenantForm";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { UserLimitSection } from "@/components/SuperAdmin/Tenants/UserLimitSection";
import { ActiveUsersDetail } from "@/components/SuperAdmin/Tenants/ActiveUsersBadge";
import { TenantBusinessSection } from "@/components/SuperAdmin/Tenants/TenantBusinessSection";
import { TenantColorsSection } from "@/components/SuperAdmin/Tenants/TenantColorsSection";
import { TenantAdminSection } from "@/components/SuperAdmin/Tenants/TenantAdminSection";
import { TenantPrinterSection } from "@/components/SuperAdmin/Tenants/TenantPrinterSection";
import { TenantDangerZone } from "@/components/SuperAdmin/Tenants/TenantDangerZone";
import { useGetTenant } from "@/services/useSuperAdminService";

export default function TenantFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const tenantId = id ? Number(id) : undefined;
    const { formik, isEdit, handleResetColors } = useTenantForm(tenantId);
    const { data: tenantDetail, refetch: refetchDetail, isRefetching: isRefetchingDetail } = useGetTenant(tenantId ?? 0);

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(SuperAdminRoutes.Tenants)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {isEdit ? "Editar cliente" : "Nuevo cliente"}
                            </h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                {isEdit ? "Modifica la configuración del tenant" : "Registra un nuevo tenant en el sistema"}
                            </p>
                        </div>
                    </div>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => navigate(SuperAdminRoutes.TenantUsers.replace(":id", String(tenantId)))}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Users size={15} />
                            Usuarios
                        </button>
                    )}
                </div>

                {isEdit && tenantDetail && (
                    <div className="mb-4">
                        <ActiveUsersDetail
                            count={tenantDetail.active_users_count ?? 0}
                            maxUsers={tenantDetail.users_count}
                            onRefresh={refetchDetail}
                            isRefreshing={isRefetchingDetail}
                        />
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <TenantBusinessSection formik={formik} />

                    <TenantColorsSection formik={formik} onResetColors={handleResetColors} />

                    {!isEdit && <TenantAdminSection formik={formik} />}

                    {isEdit && tenantDetail && (
                        <UserLimitSection
                            maxUsers={formik.values.max_users}
                            onMaxUsersChange={(v) => formik.setFieldValue("max_users", v)}
                            subscriptionPlan={tenantDetail.subscription_plan}
                            usersCount={tenantDetail.users_count ?? 0}
                            planDefaultMaxUsers={tenantDetail.plan_default_max_users}
                        />
                    )}

                    {isEdit && (
                        <TenantPrinterSection
                            enabled={formik.values.printer_enabled}
                            onToggle={() => formik.setFieldValue("printer_enabled", !formik.values.printer_enabled)}
                        />
                    )}

                    {isEdit && tenantId && <TenantDangerZone tenantId={tenantId} />}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(SuperAdminRoutes.Tenants)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                        >
                            {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                            {isEdit ? "Guardar cambios" : "Crear cliente"}
                        </button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}

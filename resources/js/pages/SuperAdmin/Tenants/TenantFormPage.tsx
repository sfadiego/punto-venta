import { ChevronLeft, Loader, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantForm } from "./useTenantForm";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { UserLimitSection } from "@/components/SuperAdmin/Tenants/Users/UserLimitSection";
import { SubscriptionAmountSection } from "@/components/SuperAdmin/Tenants/Sections/SubscriptionAmountSection";
import { ActiveUsersDetail } from "@/components/SuperAdmin/Tenants/Users/ActiveUsersBadge";
import { TenantBusinessSection } from "@/components/SuperAdmin/Tenants/Sections/TenantBusinessSection";
import { TenantColorsSection } from "@/components/SuperAdmin/Tenants/Sections/TenantColorsSection";
import { TenantAdminSection } from "@/components/SuperAdmin/Tenants/Sections/TenantAdminSection";
import { TenantPrinterSection } from "@/components/SuperAdmin/Tenants/Sections/TenantPrinterSection";
import { TenantProvidersEmployeesSection } from "@/components/SuperAdmin/Tenants/Sections/TenantProvidersEmployeesSection";
import { TenantDangerZone } from "@/components/SuperAdmin/Tenants/Sections/TenantDangerZone";
import { TenantFeatureSpotlightsSection } from "@/components/SuperAdmin/Tenants/TenantFeatureSpotlightsSection/TenantFeatureSpotlightsSection";
import { TenantRolePermissionsSection } from "@/components/SuperAdmin/Tenants/TenantRolePermissionsSection/TenantRolePermissionsSection";
import { TenantActivitySection } from "@/components/SuperAdmin/Tenants/Activity/TenantActivitySection";
import { TenantFormNav } from "./partials/TenantFormNav";
import { useGetTenant } from "@/services/useSuperAdminService";

export default function TenantFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const tenantId = id ? Number(id) : undefined;
    const { formik, isEdit, handleResetColors } = useTenantForm(tenantId);
    const { data: tenantDetail, refetch: refetchDetail, isRefetching: isRefetchingDetail } = useGetTenant(tenantId ?? 0);

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-4xl mx-auto">
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

                <div className="flex gap-8 items-start">
                    <TenantFormNav isEdit={isEdit} showDangerZone={!!tenantDetail?.is_demo} />

                    <form onSubmit={formik.handleSubmit} className="flex-1 min-w-0 space-y-6">
                        <div id="negocio">
                            <TenantBusinessSection formik={formik} />
                        </div>

                        <div id="colores">
                            <TenantColorsSection formik={formik} onResetColors={handleResetColors} />
                        </div>

                        {!isEdit && (
                            <div id="admin">
                                <TenantAdminSection formik={formik} />
                            </div>
                        )}

                        {isEdit && tenantDetail && (
                            <div id="limite">
                                <UserLimitSection
                                    maxUsers={formik.values.max_users}
                                    onMaxUsersChange={(v) => formik.setFieldValue("max_users", v)}
                                    subscriptionPlan={tenantDetail.subscription_plan}
                                    usersCount={tenantDetail.users_count ?? 0}
                                    planDefaultMaxUsers={tenantDetail.plan_default_max_users}
                                    onSave={formik.submitForm}
                                    isSaving={formik.isSubmitting}
                                />
                            </div>
                        )}

                        {isEdit && tenantDetail && (
                            <div id="suscripcion">
                                <SubscriptionAmountSection
                                    amount={formik.values.subscription_amount}
                                    onAmountChange={(v) => formik.setFieldValue("subscription_amount", v)}
                                    onSave={formik.submitForm}
                                    isSaving={formik.isSubmitting}
                                />
                            </div>
                        )}

                        {isEdit && (
                            <div id="impresora">
                                <TenantPrinterSection
                                    enabled={formik.values.printer_enabled}
                                    onToggle={() => formik.setFieldValue("printer_enabled", !formik.values.printer_enabled)}
                                    bluetoothEnabled={formik.values.bluetooth_printing_enabled}
                                    onToggleBluetooth={() =>
                                        formik.setFieldValue("bluetooth_printing_enabled", !formik.values.bluetooth_printing_enabled)
                                    }
                                    onSave={formik.submitForm}
                                    isSaving={formik.isSubmitting}
                                />
                            </div>
                        )}

                        {isEdit && (
                            <div id="proveedores-empleados">
                                <TenantProvidersEmployeesSection
                                    purchasesEnabled={formik.values.purchases_enabled}
                                    onTogglePurchases={() =>
                                        formik.setFieldValue("purchases_enabled", !formik.values.purchases_enabled)
                                    }
                                    employeesEnabled={formik.values.employees_enabled}
                                    onToggleEmployees={() =>
                                        formik.setFieldValue("employees_enabled", !formik.values.employees_enabled)
                                    }
                                    stockEnabled={formik.values.stock_enabled}
                                    onToggleStock={() =>
                                        formik.setFieldValue("stock_enabled", !formik.values.stock_enabled)
                                    }
                                    customersEnabled={formik.values.customers_enabled}
                                    onToggleCustomers={() =>
                                        formik.setFieldValue("customers_enabled", !formik.values.customers_enabled)
                                    }
                                    onSave={formik.submitForm}
                                    isSaving={formik.isSubmitting}
                                />
                            </div>
                        )}

                        {isEdit && tenantId && (
                            <div id="roles-permisos">
                                <TenantRolePermissionsSection tenantId={tenantId} features={tenantDetail?.features} />
                            </div>
                        )}

                        {isEdit && tenantId && (
                            <div id="actividad">
                                <TenantActivitySection tenantId={tenantId} lastActivityAt={tenantDetail?.last_activity_at} />
                            </div>
                        )}

                        {isEdit && tenantId && (
                            <div id="novedades">
                                <TenantFeatureSpotlightsSection tenantId={tenantId} />
                            </div>
                        )}

                        {isEdit && tenantId && tenantDetail?.is_demo && (
                            <div id="peligro">
                                <TenantDangerZone tenantId={tenantId} tenantName={tenantDetail.business_name} />
                            </div>
                        )}

                        {!isEdit && (
                            <div className="flex justify-end gap-3">
                                <button
                                    type="submit"
                                    disabled={formik.isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                                >
                                    {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                                    Crear cliente
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </SuperAdminLayout>
    );
}

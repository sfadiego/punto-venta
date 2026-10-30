import { Loader } from "lucide-react";
import { useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantForm } from "./useTenantForm";
import { UserLimitSection } from "@/components/SuperAdmin/Tenants/Users/UserLimitSection";
import { SubscriptionAmountSection } from "@/components/SuperAdmin/Tenants/Sections/SubscriptionAmountSection";
import { ActiveUsersDetail } from "@/components/SuperAdmin/Tenants/Users/ActiveUsersBadge";
import { TenantBusinessSection } from "@/components/SuperAdmin/Tenants/Sections/TenantBusinessSection";
import { TenantColorsSection } from "@/components/SuperAdmin/Tenants/Sections/TenantColorsSection";
import { TenantSubscriptionStartSection } from "@/components/SuperAdmin/Tenants/Sections/TenantSubscriptionStartSection";
import { TenantAdminSection } from "@/components/SuperAdmin/Tenants/Sections/TenantAdminSection";
import { TenantPrinterSection } from "@/components/SuperAdmin/Tenants/Sections/TenantPrinterSection";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";
import { TenantProvidersEmployeesSection } from "@/components/SuperAdmin/Tenants/Sections/TenantProvidersEmployeesSection";
import { TenantDangerZone } from "@/components/SuperAdmin/Tenants/Sections/TenantDangerZone";
import { TenantFeatureSpotlightsSection } from "@/components/SuperAdmin/Tenants/TenantFeatureSpotlightsSection/TenantFeatureSpotlightsSection";
import { TenantRolePermissionsSection } from "@/components/SuperAdmin/Tenants/TenantRolePermissionsSection/TenantRolePermissionsSection";
import { TenantBranchesSection } from "@/components/SuperAdmin/Tenants/TenantBranchesSection/TenantBranchesSection";
import { TenantActivitySection } from "@/components/SuperAdmin/Tenants/Activity/TenantActivitySection";
import { TenantInactiveSummary } from "@/components/SuperAdmin/Tenants/Sections/TenantInactiveSummary";
import { TenantFormHeader } from "./partials/TenantFormHeader";
import { TenantFormNav } from "./partials/TenantFormNav";
import { useGetTenant } from "@/services/useSuperAdminService";

export default function TenantFormPage() {
    const { id } = useParams<{ id: string }>();
    const tenantId = id ? Number(id) : undefined;
    const { formik, isEdit, handleResetColors, handleSyncAdminEmail } = useTenantForm(tenantId);
    const { data: tenantDetail, isLoading: isLoadingDetail, refetch: refetchDetail, isRefetching: isRefetchingDetail } = useGetTenant(tenantId ?? 0);

    const showDangerZone = !!tenantDetail?.is_demo || !!tenantDetail?.is_test;

    // Un cliente desactivado solo se consulta: se edita únicamente después de reactivarlo.
    if (isEdit && (isLoadingDetail || tenantDetail?.activo === false)) {
        return (
            <SuperAdminLayout>
                <div className="px-6 py-6 max-w-4xl mx-auto">
                    <TenantFormHeader isEdit={isEdit} tenantId={tenantId} />
                    {tenantDetail ? (
                        <TenantInactiveSummary tenant={tenantDetail} />
                    ) : (
                        <div className="flex justify-center py-16">
                            <Loader size={24} className="animate-spin text-slate-400" />
                        </div>
                    )}
                </div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-4xl mx-auto">
                <TenantFormHeader isEdit={isEdit} tenantId={tenantId} />

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
                    <TenantFormNav isEdit={isEdit} showDangerZone={showDangerZone} isTest={formik.values.is_test} />

                    <form onSubmit={formik.handleSubmit} noValidate className="flex-1 min-w-0 space-y-6">
                        <div id="negocio">
                            <TenantBusinessSection formik={formik} />
                        </div>

                        <div id="colores">
                            <TenantColorsSection formik={formik} onResetColors={handleResetColors} />
                        </div>

                        {!isEdit && (
                            <div id="admin">
                                <TenantAdminSection formik={formik} onSyncEmail={handleSyncAdminEmail} />
                            </div>
                        )}

                        {!isEdit && !formik.values.is_test && (
                            <div id="plan-inicial">
                                <TenantSubscriptionStartSection formik={formik} />
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

                        {isEdit && tenantDetail && !formik.values.is_test && (
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
                                    customersLocked={formik.values.tipo_negocio === BusinessTypeEnum.Retail}
                                    onToggleCustomers={() =>
                                        formik.setFieldValue("customers_enabled", !formik.values.customers_enabled)
                                    }
                                    onSave={formik.submitForm}
                                    isSaving={formik.isSubmitting}
                                />
                            </div>
                        )}

                        {isEdit && tenantId && (
                            <div id="sucursales">
                                <TenantBranchesSection
                                    tenantId={tenantId}
                                    multiBranchEnabled={tenantDetail?.multi_branch_enabled ?? false}
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

                        {isEdit && tenantId && showDangerZone && tenantDetail && (
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

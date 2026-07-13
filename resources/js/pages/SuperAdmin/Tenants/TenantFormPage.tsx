import { ChevronLeft, Loader, Users, AlertTriangle, RotateCcw, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantForm } from "./useTenantForm";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { ClearDemoDataButton } from "@/components/SuperAdmin/Tenants/ClearDemoDataButton";
import { SelectBusinessType } from "@/components/SuperAdmin/Tenants/SelectBusinessType";
import { Input } from "@/components/ui/form/Input";
import { ActiveUsersDetail } from "@/components/SuperAdmin/Tenants/ActiveUsersBadge";
import { useGetTenant } from "@/services/useSuperAdminService";

export default function TenantFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const tenantId = id ? Number(id) : undefined;
    const { formik, isEdit, handleResetColors } = useTenantForm(tenantId);
    const { data: tenantDetail, refetch: refetchDetail, isRefetching: isRefetchingDetail } = useGetTenant(tenantId ?? 0);

    const colorField = (name: keyof typeof formik.values & string, label: string) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    name={name}
                    value={formik.values[name] as string}
                    onChange={formik.handleChange}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0"
                />
                <Input name={name} formik={formik} className="font-mono" />
            </div>
        </div>
    );

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
                            onClick={() =>
                                navigate(SuperAdminRoutes.TenantUsers.replace(":id", String(tenantId)))
                            }
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
                    {/* Datos del negocio */}
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                            Datos del negocio
                        </h2>
                        <Input name="business_name" label="Nombre del negocio" placeholder="Ej: Café Luna" maxLength={100} formik={formik} />
                        <Input name="slug" label="Slug (URL de acceso)" placeholder="ej: cafe-luna" maxLength={255} formik={formik} />
                        <p className="text-xs text-slate-400">
                            El cliente accederá desde: <span className="font-mono">/{formik.values.slug || "slug"}/login</span>
                        </p>

                        <SelectBusinessType
                            name="tipo_negocio"
                            formik={formik}
                        />
                    </section>

                    {/* Colores */}
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                            Colores del tema
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {colorField("primary_color", "Color primario")}
                            {colorField("sidebar_color", "Color sidebar")}
                            {colorField("font_color", "Color fuente")}
                            {colorField("label_color", "Color etiqueta")}
                        </div>
                        <button
                            type="button"
                            onClick={handleResetColors}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                            <RotateCcw size={12} />
                            Restablecer colores por defecto
                        </button>
                    </section>

                    {/* Admin user — solo al crear */}
                    {!isEdit && (
                        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                                Usuario administrador
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input name="admin_nombre" label="Nombre" maxLength={100} formik={formik} />
                                <Input name="admin_apellido" label="Apellido" maxLength={100} formik={formik} />
                                <Input name="admin_email" label="Correo electrónico" inputType="email" formik={formik} />
                                <Input name="admin_usuario" label="Nombre de usuario" maxLength={255} formik={formik} />
                            </div>
                            <Input
                                name="admin_password"
                                label="Contraseña"
                                inputType="password"
                                formik={formik}
                            />
                        </section>
                    )}


                    {/* Agente de impresión — solo en edición */}
                    {isEdit && (
                        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <Printer size={17} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900">
                                            Agente de impresión
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Habilita la conexión con el agente local del cliente. Se activa automáticamente en desarrollo.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        formik.setFieldValue("printer_enabled", !formik.values.printer_enabled)
                                    }
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                        formik.values.printer_enabled ? "bg-indigo-600" : "bg-slate-200"
                                    }`}
                                    role="switch"
                                    aria-checked={formik.values.printer_enabled}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                            formik.values.printer_enabled ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                        </section>
                    )}

                    {isEdit && (
                        <section className="mt-6 bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className=" gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mb-2">
                                        <AlertTriangle size={17} className="text-red-500" />
                                    </div>
                                    <div className="mb-2">
                                        <h2 className="text-sm font-semibold text-slate-900 mb-2">
                                            Zona de peligro
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Elimina todos los datos de prueba generados durante el demo.
                                            Esta acción no se puede deshacer.
                                        </p>
                                    </div>
                                    <ClearDemoDataButton tenantId={tenantId!} />
                                </div>
                            </div>
                        </section>
                    )}

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

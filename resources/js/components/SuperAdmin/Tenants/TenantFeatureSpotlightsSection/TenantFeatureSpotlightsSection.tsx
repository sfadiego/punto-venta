import { CheckSquare, Loader, Sparkles, Square } from "lucide-react";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { useTenantFeatureSpotlightsSection } from "./useTenantFeatureSpotlightsSection";

const FEATURE_LABELS: Record<FeatureSpotlightKey, string> = {
    [FeatureSpotlightKey.RolePermissions]: "Roles y permisos",
    [FeatureSpotlightKey.ExpensesButton]: "Registrar gasto",
    [FeatureSpotlightKey.CustomerSection]: "Sección de clientes",
    [FeatureSpotlightKey.UsersSection]: "Sección de usuarios",
    [FeatureSpotlightKey.ProductSection]: "Sección de productos",
    [FeatureSpotlightKey.CategoriesSection]: "Sección de categorías",
    [FeatureSpotlightKey.ConfigurationSection]: "Sección de configuración",
    [FeatureSpotlightKey.DeliverySection]: "Sección de domicilio",
    [FeatureSpotlightKey.SubscriptionSection]: "Sección de suscripción",
    [FeatureSpotlightKey.OnlineMenuSection]: "Sección de menú online",
    [FeatureSpotlightKey.OrderListSection]: "Lista de pedidos/órdenes",
    [FeatureSpotlightKey.TicketSection]: "Sección de tickets",
    [FeatureSpotlightKey.FilterSalesByDateMonth]: "Filtro de ventas por mes",
};

interface TenantFeatureSpotlightsSectionProps {
    tenantId: number;
}

export const TenantFeatureSpotlightsSection = ({ tenantId }: TenantFeatureSpotlightsSectionProps) => {
    const { enabledKeys, toggle, allChecked, toggleAll, handleSave, saving, isLoading } =
        useTenantFeatureSpotlightsSection(tenantId);

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Sparkles size={17} className="text-slate-500" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">Novedades (spotlights)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Elige qué módulos se muestran como "nueva función" a este cliente. Desmarca los que ya conoce.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader size={18} className="animate-spin text-slate-400" />
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        {allChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                        {allChecked ? "Desmarcar todo" : "Marcar todo"}
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 mb-5">
                        {Object.values(FeatureSpotlightKey).map((key) => (
                            <label
                                key={key}
                                className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={enabledKeys.has(key)}
                                    onChange={() => toggle(key)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {FEATURE_LABELS[key]}
                            </label>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                    >
                        {saving && <Loader size={14} className="animate-spin" />}
                        {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                </>
            )}
        </section>
    );
};

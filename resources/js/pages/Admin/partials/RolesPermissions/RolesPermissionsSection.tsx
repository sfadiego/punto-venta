import { Save, ShieldCheck } from "lucide-react";
import { RoleEnum } from "@/enums/RoleEnum";
import { Action, ALL_ACTIONS } from "@/hooks/usePermissions";
import { CONFIGURABLE_ROLES, useRolesPermissionsSection } from "./useRolesPermissionsSection";

const ROLE_LABELS: Record<number, string> = {
    [RoleEnum.Employe]: "Empleado",
    [RoleEnum.Cocina]: "Cocina",
    [RoleEnum.Caja]: "Caja",
};

const PERMISSION_LABELS: Record<Action, string> = {
    viewDashboard: "Ver dashboard",
    viewOrders: "Ver órdenes",
    viewProducts: "Ver productos",
    viewCategories: "Ver categorías",
    viewSales: "Ver ventas (histórico)",
    viewStatistics: "Ver estadísticas",
    viewAdmin: "Ver panel de administración",
    viewCloseSales: "Ver cierre de caja",
    takeOrder: "Tomar pedidos",
    payOrder: "Cobrar ventas",
    deleteOrder: "Eliminar órdenes",
    editOrderName: "Editar nombre/datos de la orden",
    printTicket: "Imprimir ticket",
    kitchenView: "Vista de cocina",
    managePendingOrders: "Gestionar órdenes pendientes",
    viewUsers: "Ver usuarios",
    viewCustomers: "Ver clientes",
    registerExpense: "Registrar gastos",
};

export function RolesPermissionsSection() {
    const { activeRole, setActiveRole, activeActions, toggle, handleSave, saving, isLoading } =
        useRolesPermissionsSection();

    return (
        <section className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-amber-500" />
                <h2 className="text-base font-semibold text-stone-800">
                    Roles y permisos
                </h2>
            </div>
            <p className="text-xs text-stone-400 mb-5">
                Elige qué puede hacer cada rol dentro del sistema
            </p>

            <div className="flex gap-2 mb-5 border-b border-stone-100">
                {CONFIGURABLE_ROLES.map((role) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => setActiveRole(role)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeRole === role
                                ? "border-amber-500 text-amber-600"
                                : "border-transparent text-stone-400 hover:text-stone-600"
                        }`}
                    >
                        {ROLE_LABELS[role]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {ALL_ACTIONS.map((action) => (
                            <label
                                key={action}
                                className="flex items-center gap-2.5 text-sm text-stone-600 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={activeActions.has(action)}
                                    onChange={() => toggle(action)}
                                    className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                                />
                                {PERMISSION_LABELS[action]}
                            </label>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Save size={15} />
                        {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                </>
            )}
        </section>
    );
}

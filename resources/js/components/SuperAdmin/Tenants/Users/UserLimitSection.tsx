import { Users, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { PLAN_LABELS, PLAN_MAX_USERS, SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";

interface UserLimitSectionProps {
    maxUsers: number | null | undefined;
    onMaxUsersChange: (value: number | null) => void;
    subscriptionPlan: string | null | undefined;
    usersCount: number;
    planDefaultMaxUsers: number | null | undefined;
}

export const UserLimitSection = ({
    maxUsers,
    onMaxUsersChange,
    subscriptionPlan,
    usersCount,
    planDefaultMaxUsers,
}: UserLimitSectionProps) => {
    const plan = subscriptionPlan
        ? SubscriptionPlanEnum[subscriptionPlan as keyof typeof SubscriptionPlanEnum] ?? null
        : null;

    const planLabel = plan ? PLAN_LABELS[plan as SubscriptionPlanEnum] : null;
    const planDefault = planDefaultMaxUsers ?? (plan ? PLAN_MAX_USERS[plan as SubscriptionPlanEnum] : null);
    const currentLimit = maxUsers ?? planDefault ?? 2;
    const isOverPlan = planDefault !== null && maxUsers !== null && maxUsers !== undefined && maxUsers > planDefault;
    const isAtLimit = usersCount >= currentLimit;

    const handleReset = () => onMaxUsersChange(planDefault ?? 2);

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Users size={17} className="text-indigo-500" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">Límite de usuarios</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Define cuántos usuarios puede tener este cliente.
                    </p>
                </div>
            </div>

            {/* Estado actual */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Usuarios registrados</p>
                    <p className="text-sm font-semibold text-slate-800">
                        {usersCount}
                        <span className="font-normal text-slate-400 ml-1">/ {currentLimit} permitidos</span>
                    </p>
                </div>
                {isAtLimit && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                        Límite alcanzado
                    </span>
                )}
            </div>

            {/* Plan actual */}
            {planLabel && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Plan actual</span>
                    <span className="font-medium text-slate-700">{planLabel}</span>
                </div>
            )}

            {planDefault !== null && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Límite del plan</span>
                    <span className="font-medium text-slate-700">{planDefault} usuarios</span>
                </div>
            )}

            {/* Override manual */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Límite personalizado</label>
                    {planDefault !== null && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            <RotateCcw size={11} />
                            Restablecer al plan
                        </button>
                    )}
                </div>
                <Input
                    name="max_users"
                    inputType="number"
                    min={1}
                    max={999}
                    value={maxUsers !== null && maxUsers !== undefined ? String(maxUsers) : ""}
                    placeholder={String(planDefault ?? 2)}
                    onChange={(e) => {
                        const val = e.target.value;
                        onMaxUsersChange(val === "" ? null : parseInt(val, 10));
                    }}
                />
                {isOverPlan && planDefault !== null && (
                    <p className="text-xs text-amber-600">
                        Este límite supera el del plan ({planDefault}). Se aplica igual.
                    </p>
                )}
                <p className="text-xs text-slate-400">
                    Cambia el plan de suscripción para actualizar el límite automáticamente, o establece un valor personalizado aquí.
                </p>
            </div>
        </section>
    );
};

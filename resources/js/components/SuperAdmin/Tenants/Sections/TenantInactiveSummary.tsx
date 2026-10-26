import { Loader, Lock, Power } from "lucide-react";
import { ITenant } from "@/models/ITenant";
import { useTenantInactiveSummary } from "./useTenantInactiveSummary";

interface TenantInactiveSummaryProps {
    tenant: ITenant;
}

export const TenantInactiveSummary = ({ tenant }: TenantInactiveSummaryProps) => {
    const { fields, isReactivating, handleReactivate } = useTenantInactiveSummary(tenant);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                    <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Este cliente está desactivado</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Sus usuarios no pueden entrar y su información no se puede modificar. Reactívalo para editarlo.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleReactivate}
                    disabled={isReactivating}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shrink-0"
                >
                    {isReactivating ? <Loader size={15} className="animate-spin" /> : <Power size={15} />}
                    Reactivar
                </button>
            </div>

            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Datos del negocio</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {fields.map((field) => (
                        <div key={field.label} className="min-w-0">
                            <dt className="text-xs text-slate-400">{field.label}</dt>
                            <dd className="text-sm font-medium text-slate-800 mt-0.5 break-words">{field.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        </div>
    );
};

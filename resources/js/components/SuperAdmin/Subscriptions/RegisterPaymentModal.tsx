import { X, Loader, CreditCard, CalendarDays } from "lucide-react";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { SubscriptionPlanEnum, PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";
import { useRegisterPaymentModal } from "./useRegisterPaymentModal";

interface RegisterPaymentModalProps {
    tenant: ITenantWithSubscription | null;
    onClose: () => void;
}

export const RegisterPaymentModal = ({ tenant, onClose }: RegisterPaymentModalProps) => {
    const { formik, isLifetime, expiresAt } = useRegisterPaymentModal(tenant, onClose);

    if (!tenant) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-indigo-500" />
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Registrar pago</h2>
                            <p className="text-xs text-slate-400">{tenant.business_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Plan</label>
                        <select
                            name="plan"
                            value={formik.values.plan}
                            onChange={(e) => formik.setFieldValue("plan", e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                            {Object.values(SubscriptionPlanEnum).map((p) => (
                                <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha de inicio</label>
                        <input
                            type="date"
                            name="starts_at"
                            value={formik.values.starts_at}
                            onChange={formik.handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        {isLifetime && (
                            <p className="flex items-center gap-1.5 text-xs text-indigo-500 mt-1.5">
                                <CalendarDays size={12} />
                                Sin fecha de vencimiento
                            </p>
                        )}
                        {expiresAt && (
                            <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                                <CalendarDays size={12} />
                                Vence el {expiresAt}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Monto cobrado <span className="text-slate-400">(opcional)</span></label>
                        <input
                            type="number"
                            name="amount"
                            value={formik.values.amount}
                            onChange={formik.handleChange}
                            placeholder="0.00"
                            min={0}
                            step="0.01"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas <span className="text-slate-400">(opcional)</span></label>
                        <textarea
                            name="notes"
                            value={formik.values.notes}
                            onChange={formik.handleChange}
                            rows={2}
                            placeholder="Referencia, método de pago..."
                            maxLength={300}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                        >
                            {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

import { X, Receipt, Loader } from "lucide-react";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePaymentHistoryModal } from "./usePaymentHistoryModal";

interface PaymentHistoryModalProps {
    tenant: ITenantWithSubscription | null;
    onClose: () => void;
}

export const PaymentHistoryModal = ({ tenant, onClose }: PaymentHistoryModalProps) => {
    const { records, isLoading } = usePaymentHistoryModal(tenant);

    if (!tenant) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <Receipt size={18} className="text-indigo-500" />
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Historial de pagos</h2>
                            <p className="text-xs text-slate-400">{tenant.business_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader size={20} className="animate-spin text-indigo-400" />
                        </div>
                    ) : records.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10">Sin pagos registrados</p>
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {records.map((r) => (
                                <li key={r.id} className="border border-slate-100 rounded-xl px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-slate-800">{PLAN_LABELS[r.plan]}</span>
                                        <span className="text-sm font-semibold text-indigo-600">
                                            {r.amount != null ? formatCurrency(r.amount) : <span className="text-slate-300 font-normal">Sin monto</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 mt-1">
                                        <span className="text-xs text-slate-400">
                                            Pagado el {r.paid_at
                                                ? new Date(r.paid_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                                                : "—"}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {r.is_lifetime
                                                ? "Vigencia indefinida"
                                                : `Vence ${new Date(r.expires_at!).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}`}
                                        </span>
                                    </div>
                                    {r.notes && (
                                        <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">{r.notes}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

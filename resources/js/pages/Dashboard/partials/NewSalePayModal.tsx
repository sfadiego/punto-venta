import { X, DollarSign, Loader, ShoppingCart } from "lucide-react";

interface NewSalePayModalProps {
    totalFinal: number;
    cash: string;
    setCash: (v: string) => void;
    cashNum: number;
    change: number;
    canPay: boolean;
    isPaying: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export const NewSalePayModal = ({
    totalFinal, cash, setCash, cashNum, change,
    canPay, isPaying, onConfirm, onClose,
}: NewSalePayModalProps) => (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900">Cobrar</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                    <span className="text-sm text-stone-500">Total a cobrar</span>
                    <span className="text-xl font-bold text-stone-900">${totalFinal.toFixed(2)}</span>
                </div>

                <div>
                    <label className="block text-xs text-stone-500 mb-1">Efectivo recibido</label>
                    <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={cash}
                            onChange={(e) => setCash(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                            className="w-full pl-8 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm text-right
                                focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>
                </div>

                {cashNum > 0 && (
                    <div className={`flex items-center justify-between p-3 rounded-xl ${
                        change >= 0 ? "bg-emerald-50" : "bg-red-50"
                    }`}>
                        <span className="text-sm text-stone-500">Cambio</span>
                        <span className={`text-lg font-bold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            ${change.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>

            <button
                onClick={onConfirm}
                disabled={!canPay || isPaying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                    bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                    text-white text-sm font-semibold transition-colors"
            >
                {isPaying
                    ? <Loader size={15} className="animate-spin" />
                    : <ShoppingCart size={15} />
                }
                Confirmar pago
            </button>
        </div>
    </div>
);

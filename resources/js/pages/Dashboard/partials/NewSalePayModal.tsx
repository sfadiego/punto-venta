import { X, Loader, ShoppingCart, Banknote, CreditCard, TriangleAlert } from "lucide-react";
import { IPaymentMethod } from "@/models/IPaymentMethod";
import { Input } from "@/components/ui/form/Input";

interface NewSalePayModalProps {
    totalFinal: number;
    cash: string;
    setCash: (v: string) => void;
    cashNum: number;
    change: number;
    canPay: boolean;
    isPaying: boolean;
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    setPaymentMethodId: (id: number | null) => void;
    isCashMethod: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export const NewSalePayModal = ({
    totalFinal, cash, setCash, cashNum, change,
    canPay, isPaying, paymentMethods, paymentMethodId, setPaymentMethodId, isCashMethod,
    onConfirm, onClose,
}: NewSalePayModalProps) => {
    const activeMethods = paymentMethods.filter((m) => m.active);

    return (
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

                    {/* Método de pago */}
                    {activeMethods.length > 0 && (
                        <div>
                            <p className="text-xs text-stone-500 mb-2">Método de pago</p>
                            <div className="flex gap-2 flex-wrap">
                                {activeMethods.map((method) => {
                                    const isSelected = method.id === paymentMethodId;
                                    const isCash = method.name.toLowerCase().includes("efectivo");
                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentMethodId(method.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                                isSelected
                                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105"
                                                    : "bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:bg-emerald-50"
                                            }`}
                                        >
                                            {isCash ? <Banknote size={14} /> : <CreditCard size={14} />}
                                            {method.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Alerta de comprobante — visible solo en métodos que no son efectivo */}
                    <div className={`fade-collapse ${!isCashMethod ? "is-visible" : "is-hidden"}`}>
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <TriangleAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                <span className="font-semibold">Solicita el comprobante</span> de transferencia al cliente antes de confirmar el pago.
                            </p>
                        </div>
                    </div>

                    {/* Efectivo + cambio — fade in/out */}
                    <div className={`fade-collapse space-y-3 ${isCashMethod ? "is-visible" : "is-hidden"}`}>
                        <Input
                            name="cash"
                            label="Efectivo recibido"
                            inputType="number"
                            placeholder="0.00"
                            min={0}
                            max={Math.ceil(totalFinal * 10)}
                            step={0.5}
                            value={cash}
                            onChange={(e) => {
                                const val = e.target.value;
                                const num = parseFloat(val);
                                const max = Math.ceil(totalFinal * 10);
                                if (val === "" || (!isNaN(num) && num <= max)) setCash(val);
                            }}
                        />

                        {cashNum > 0 && (
                            <div className={`flex items-center justify-between p-3 rounded-xl transition-colors duration-200 ${
                                change >= 0 ? "bg-emerald-50" : "bg-red-50"
                            }`}>
                                <span className="text-sm text-stone-500">Cambio</span>
                                <span className={`text-lg font-bold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    ${change.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={onConfirm}
                    disabled={!canPay || isPaying}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
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
};

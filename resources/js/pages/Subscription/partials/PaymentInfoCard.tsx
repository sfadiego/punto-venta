import { Building2, Hash, User, FileText, Banknote } from "lucide-react";
import { IPaymentInfo } from "@/models/ISubscription";
import { formatCurrency } from "@/utils/formatCurrency";
import { Row, Divider } from "./SubscriptionRow";

interface PaymentInfoCardProps {
    info: IPaymentInfo;
    amountDue?: number | null;
}

export const PaymentInfoCard = ({ info, amountDue }: PaymentInfoCardProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
        <p className="text-sm font-semibold text-stone-700">Datos para transferencia</p>
        {amountDue != null && (
            <>
                <div className="flex items-center justify-between gap-4 bg-amber-50 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                        <Banknote size={15} />
                        Monto a depositar
                    </div>
                    <span className="text-base font-semibold text-amber-700">{formatCurrency(amountDue)}</span>
                </div>
                <Divider />
            </>
        )}
        <Row icon={<Building2 size={15} className="text-amber-500" />} label="Banco" value={info.bank} />
        <Divider />
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-500">
                <Hash size={15} className="text-amber-500" />
                Número de cuenta
            </div>
            <button
                onClick={() => navigator.clipboard.writeText(info.account)}
                title="Copiar número de cuenta"
                className="text-sm font-mono font-medium text-stone-800 hover:text-amber-600 transition-colors"
            >
                {info.account}
            </button>
        </div>
        <Divider />
        <Row icon={<User size={15} className="text-amber-500" />} label="Titular" value={info.holder} />
        {info.concept && (
            <>
                <Divider />
                <Row icon={<FileText size={15} className="text-amber-500" />} label="Concepto" value={info.concept} />
            </>
        )}
    </div>
);

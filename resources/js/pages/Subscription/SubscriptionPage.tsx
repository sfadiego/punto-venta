import { CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, MessageCircle, Info } from "lucide-react";
import { useSubscriptionPage } from "./useSubscriptionPage";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";

function SubscriptionPage() {
    const { data, isLoading, planLabel, expiresLabel, whatsappUrl } = useSubscriptionPage();

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-amber-600" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Mi suscripción</h1>
                    <p className="text-xs text-stone-400">Estado actual de tu plan</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data ? (
                <div className="flex flex-col gap-4">
                    <StatusCard status={data.status} daysRemaining={data.days_remaining} />

                    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
                        <Row
                            icon={<CreditCard size={15} className="text-amber-500" />}
                            label="Plan activo"
                            value={planLabel ?? "Sin plan"}
                        />
                        <Divider />
                        <Row
                            icon={<Calendar size={15} className="text-amber-500" />}
                            label="Fecha de vencimiento"
                            value={data.plan === "lifetime" ? "Indefinida" : (expiresLabel ?? "—")}
                        />
                        {data.days_remaining !== null && data.plan !== "lifetime" && (
                            <>
                                <Divider />
                                <Row
                                    icon={<Clock size={15} className="text-amber-500" />}
                                    label="Días restantes"
                                    value={
                                        data.days_remaining >= 0
                                            ? `${data.days_remaining} día${data.days_remaining !== 1 ? "s" : ""}`
                                            : `Venció hace ${Math.abs(data.days_remaining)} día${Math.abs(data.days_remaining) !== 1 ? "s" : ""}`
                                    }
                                />
                            </>
                        )}
                    </div>

                    <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
                        <div className="flex items-start gap-2.5">
                            <Info size={15} className="text-stone-400 mt-0.5 shrink-0" />
                            <div className="text-sm text-stone-500 leading-relaxed">
                                <p className="font-medium text-stone-600 mb-1">¿Cómo renovar tu suscripción?</p>
                                <p>
                                    Si realizaste una <span className="font-medium">transferencia bancaria</span>, envía
                                    tu comprobante por WhatsApp y lo procesaremos a la brevedad.
                                </p>
                                <p className="mt-1.5">
                                    Si pagaste de <span className="font-medium">manera presencial</span>, el
                                    administrador actualizará tu plan directamente.
                                </p>
                            </div>
                        </div>

                        {whatsappUrl ? (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                            >
                                <MessageCircle size={16} />
                                Enviar comprobante por WhatsApp
                            </a>
                        ) : (
                            <p className="text-xs text-stone-400 text-center">
                                Contacta al administrador para obtener información de pago.
                            </p>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

interface StatusCardProps {
    status: SubscriptionStatusEnum;
    daysRemaining: number | null;
}

const STATUS_CONFIG = {
    [SubscriptionStatusEnum.Active]: {
        icon: <CheckCircle size={18} />,
        label: "Suscripción activa",
        color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    [SubscriptionStatusEnum.Grace]: {
        icon: <AlertTriangle size={18} />,
        label: "Período de gracia",
        color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    [SubscriptionStatusEnum.Expired]: {
        icon: <XCircle size={18} />,
        label: "Suscripción vencida",
        color: "bg-red-50 border-red-200 text-red-700",
    },
    [SubscriptionStatusEnum.Pending]: {
        icon: <Clock size={18} />,
        label: "Sin suscripción activa",
        color: "bg-slate-50 border-slate-200 text-slate-500",
    },
};

const StatusCard = ({ status, daysRemaining }: StatusCardProps) => {
    const cfg = STATUS_CONFIG[status];
    return (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.color}`}>
            <span className="shrink-0">{cfg.icon}</span>
            <div>
                <p className="font-semibold text-sm">{cfg.label}</p>
                {status === SubscriptionStatusEnum.Grace && (
                    <p className="text-xs opacity-80 mt-0.5">
                        Tu acceso se mantendrá activo por unos días más mientras regularizas el pago.
                    </p>
                )}
                {status === SubscriptionStatusEnum.Active && daysRemaining !== null && daysRemaining <= 7 && (
                    <p className="text-xs opacity-80 mt-0.5">
                        Vence pronto — considera renovar para no perder el acceso.
                    </p>
                )}
            </div>
        </div>
    );
};

interface RowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const Row = ({ icon, label, value }: RowProps) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-stone-500">
            {icon}
            {label}
        </div>
        <span className="text-sm font-medium text-stone-800">{value}</span>
    </div>
);

const Divider = () => <hr className="border-stone-100" />;

export default SubscriptionPage;

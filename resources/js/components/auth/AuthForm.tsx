import { useState } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useAuth } from "./useAuth";
import { Input } from "../ui/form/Input";
import { SubscriptionExpiredModal } from "./SubscriptionExpiredModal";

export const AuthForm = () => {
    const { formik, loginMutation, banner, subscriptionExpired } = useAuth();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    return (
        <>
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
                {banner && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">{banner}</p>
                    </div>
                )}

                <Input
                    label="Correo electronico"
                    inputType="email"
                    name="email"
                    formik={formik}
                    placeholder="correo@ejemplo.com"
                />
                <Input
                    label="Contraseña"
                    inputType="password"
                    name="password"
                    formik={formik}
                    placeholder="••••••••"
                />
                <button
                    type="submit"
                    disabled={formik.isSubmitting || loginMutation.isPending}
                    className="w-full flex items-center justify-center text-white font-semibold py-3 px-4 rounded-xl transition-opacity duration-150 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    {loginMutation.isPending ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Ingresando...
                        </>
                    ) : (
                        "Iniciar sesion"
                    )}
                </button>

                {/* Poco invasivo a propósito: el toast ya avisa del bloqueo; esto solo da
                acceso opcional al detalle (reutiliza PaymentInfoCard/RenewalCard vía el modal). */}
                {subscriptionExpired && (
                    <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 transition-colors"
                    >
                        <CreditCard size={13} />
                        Ver datos para renovar la suscripción
                    </button>
                )}
            </form>

            {isPaymentModalOpen && subscriptionExpired && (
                <SubscriptionExpiredModal info={subscriptionExpired} onClose={() => setIsPaymentModalOpen(false)} />
            )}
        </>
    );
};

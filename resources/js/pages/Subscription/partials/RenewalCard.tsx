import { Info, MessageCircle } from "lucide-react";

interface RenewalCardProps {
    whatsappUrl: string | null;
}

export const RenewalCard = ({ whatsappUrl }: RenewalCardProps) => (
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
);

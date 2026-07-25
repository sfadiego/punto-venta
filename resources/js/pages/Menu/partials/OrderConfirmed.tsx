import { CheckCircle2, Phone } from "lucide-react";
import { IMenuBusiness } from "@/models/IMenu";

interface OrderConfirmedProps {
    business: IMenuBusiness;
    onNewOrder: () => void;
}

export const OrderConfirmed = ({ business, onNewOrder }: OrderConfirmedProps) => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            {business.logo && (
                <img
                    src={business.logo}
                    alt={business.business_name}
                    className="h-10 object-contain mb-4"
                />
            )}

            <h1 className="text-xl font-semibold text-stone-800 mb-2">
                ¡Gracias por tu pedido!
            </h1>

            <p className="text-stone-500 text-sm max-w-xs leading-relaxed">
                Tu pedido a <span className="font-medium text-stone-700">{business.business_name}</span> fue
                enviado correctamente.
                {business.phone && " Comunícate para confirmarlo y evitar que se cancele."}
            </p>

            {business.phone && (
                <a
                    href={`tel:${business.phone}`}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-stone-600 bg-white border border-stone-200 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
                >
                    <Phone size={15} />
                    {business.phone}
                </a>
            )}

            <button
                onClick={onNewOrder}
                className="mt-8 px-6 py-3 rounded-2xl text-white text-sm font-semibold transition-opacity active:opacity-80"
                style={{ backgroundColor: business.primary_color }}
            >
                Hacer otro pedido
            </button>
        </div>
    );
};

import { Clock } from "lucide-react";
import { IMenuBusiness } from "@/services/useMenuService";

interface BusinessClosedProps {
    business: IMenuBusiness;
}

export const BusinessClosed = ({ business }: BusinessClosedProps) => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                <Clock className="w-8 h-8 text-stone-400" />
            </div>

            {business.logo && (
                <img
                    src={business.logo}
                    alt={business.business_name}
                    className="h-10 object-contain mb-4"
                />
            )}

            <h1 className="text-xl font-semibold text-stone-800 mb-2">
                {business.business_name}
            </h1>

            <p className="text-stone-500 text-sm max-w-xs leading-relaxed">
                Este negocio aún no está procesando pedidos. Revisa los horarios e inténtalo más tarde.
            </p>
        </div>
    );
};

import { ChevronDown, ChevronRight, Phone, MapPin, Store, Bike, User } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { useCustomerInfoSection } from "./useCustomerInfoSection";

interface CustomerInfoSectionProps {
    order: IOrder;
}

export const CustomerInfoSection = ({ order }: CustomerInfoSectionProps) => {
    const { showCustomerInfo, toggle } = useCustomerInfoSection();
    const isDelivery = !!order.is_delivery;
    const hasCustomerInfo =
        !!order.customer?.phone || !!order.delivery_address || !!order.delivery_reference;

    if (!hasCustomerInfo) return null;

    return (
        <div className="border-b border-stone-100 shrink-0">
            <button
                type="button"
                onClick={toggle}
                className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
            >
                <span className="flex items-center gap-1.5">
                    <User size={12} className="text-orange-600" />
                    Datos del cliente
                    <span className="flex items-center gap-1 bg-white/70 text-orange-700 px-1.5 py-0.5 rounded-full">
                        {isDelivery ? (
                            <>
                                <Bike size={10} /> Domicilio
                            </>
                        ) : (
                            <>
                                <Store size={10} /> Tienda
                            </>
                        )}
                    </span>
                </span>
                {showCustomerInfo ? (
                    <ChevronDown size={14} className="text-orange-600" />
                ) : (
                    <ChevronRight size={14} className="text-orange-600" />
                )}
            </button>
            {showCustomerInfo && (
                <div className="px-5 pb-3 space-y-2">
                    {order.customer?.phone && (
                        <a
                            href={`tel:${order.customer.phone}`}
                            className="flex items-center gap-1 text-xs text-orange-600 hover:underline"
                        >
                            <Phone size={12} />
                            {order.customer.phone}
                        </a>
                    )}
                    {isDelivery && (order.delivery_address || order.delivery_reference) && (
                        <div className="flex items-start gap-1.5 text-xs text-stone-500 bg-stone-50 rounded-xl px-3 py-2">
                            <MapPin size={12} className="mt-0.5 shrink-0 text-stone-400" />
                            <div>
                                {order.delivery_address && <p>{order.delivery_address}</p>}
                                {order.delivery_reference && (
                                    <p className="text-stone-400">{order.delivery_reference}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

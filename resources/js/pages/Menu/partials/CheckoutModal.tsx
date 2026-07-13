import { X, Bike, Store, Loader } from "lucide-react";
import { useCheckoutModal } from "../useCheckoutModal";
import { ICartItem } from "@/models/IMenu";
import { Input } from "@/components/ui/form/Input";
import { AddressAutocomplete } from "@/components/ui/form/AddressAutocomplete";
import { useGetMenuBusiness } from "@/services/useMenuService";
import { DeliveryOption } from "./DeliveryOption";

interface CheckoutModalProps {
    open: boolean;
    slug: string;
    items: ICartItem[];
    deliveryCost: number;
    primaryColor: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const CheckoutModal = ({ open, slug, items, deliveryCost, primaryColor, onClose, onSuccess }: CheckoutModalProps) => {
    const { formik, subtotal, total } = useCheckoutModal({
        slug,
        items,
        deliveryCost,
        onSuccess: () => { onClose(); onSuccess(); },
    });

    const { data: business } = useGetMenuBusiness(slug);
    const tenantName = business?.business_name ?? "el negocio";

    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

            <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
                <div
                    className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-2xl flex flex-col pointer-events-auto"
                    style={{ maxHeight: "95dvh" }}
                >
                    <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-3 md:hidden shrink-0" />

                    <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-stone-100 shrink-0">
                        <h2 className="text-base font-semibold text-stone-800">Datos de tu pedido</h2>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors flex items-center justify-center"
                        >
                            <X size={16} className="text-stone-500" />
                        </button>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="px-5 py-5 flex flex-col gap-4 flex-1 overflow-y-auto">
                            <Input
                                formik={formik}
                                name="customer_name"
                                label="Tu nombre"
                                placeholder="Nombre completo"
                                inputType="text"
                                autoComplete="name"
                            />
                            <Input
                                formik={formik}
                                name="customer_phone"
                                label="Tu teléfono"
                                placeholder="Para confirmar tu pedido"
                                inputType="tel"
                                autoComplete="tel"
                                maxLength={12}
                            />

                            <div>
                                <p className="text-sm font-medium text-stone-700 mb-2.5">¿Cómo recibirás tu pedido?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <DeliveryOption
                                        icon={<Store size={18} />}
                                        label="Recoger en tienda"
                                        active={!formik.values.is_delivery}
                                        primaryColor={primaryColor}
                                        onClick={() => formik.setFieldValue("is_delivery", false)}
                                    />
                                    <DeliveryOption
                                        icon={<Bike size={18} />}
                                        label={deliveryCost > 0 ? `A domicilio +$${Number(deliveryCost).toFixed(0)}` : "A domicilio"}
                                        active={formik.values.is_delivery}
                                        primaryColor={primaryColor}
                                        onClick={() => formik.setFieldValue("is_delivery", true)}
                                    />
                                </div>
                            </div>

                            {formik.values.is_delivery && (
                                <>
                                    <AddressAutocomplete
                                        formik={formik}
                                        name="delivery_address"
                                        label="Dirección de entrega"
                                        placeholder="Calle, número, colonia…"
                                    />
                                    <Input
                                        formik={formik}
                                        name="delivery_reference"
                                        label="Referencia (opcional)"
                                        placeholder="Ej. casa blanca, portón azul, junto al oxxo…"
                                    />
                                </>
                            )}

                            <div className="bg-stone-50 rounded-2xl p-4 flex flex-col gap-2.5 text-sm">
                                <div className="flex justify-between text-stone-500">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                                </div>
                                {formik.values.is_delivery && deliveryCost > 0 && (
                                    <div className="flex justify-between text-stone-500">
                                        <span>Costo domicilio</span>
                                        <span className="tabular-nums">${Number(deliveryCost).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold text-stone-800 pt-2 border-t border-stone-200">
                                    <span>Total estimado</span>
                                    <span className="tabular-nums">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <p className="text-xs text-stone-400 text-center leading-relaxed">
                                Llama al `{tenantName}` para confirmar tu pedido y evitar que se cancele. El tiempo de entrega puede variar según la disponiblidad de `{tenantName}`
                            </p>
                        </div>

                        <div
                            className="px-5 pt-3 border-t border-stone-100 shrink-0"
                            style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
                        >
                            <button
                                type="submit"
                                disabled={formik.isSubmitting}
                                className="w-full py-4 rounded-2xl text-white text-sm font-semibold transition-opacity active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {formik.isSubmitting && <Loader size={16} className="animate-spin" />}
                                Enviar pedido
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

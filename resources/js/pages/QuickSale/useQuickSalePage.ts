import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { IProduct } from "@/models/IProduct";
import { isWeightUnit } from "@/utils/weightUnits";
import { ScaleReadStatusEnum } from "@/enums/ScaleReadStatusEnum";
import { calcModalCartTotal } from "@/utils/sellByWeightCartCalc";
import { calcDeliveryTotal } from "@/utils/deliveryCalc";
import { useQuickSaleCatalog } from "./useQuickSaleCatalog";
import { useQuickSaleScale } from "./useQuickSaleScale";
import { useQuickSaleCart } from "./useQuickSaleCart";
import { useQuickSaleDelivery } from "./useQuickSaleDelivery";
import { useQuickSaleOrderLifecycle } from "./useQuickSaleOrderLifecycle";
import { useQuickSalePayment } from "./useQuickSalePayment";

const DEFAULT_TAP_KG = 0.5;

export const useQuickSalePage = () => {
    const navigate = useNavigate();
    const { sistemaId } = useAxios();
    const { id } = useParams<{ id?: string }>();
    const resumeOrderId = id ? Number(id) : null;

    const catalog = useQuickSaleCatalog();
    const scale = useQuickSaleScale();
    const cart = useQuickSaleCart(resumeOrderId);
    const delivery = useQuickSaleDelivery(resumeOrderId);

    const productsTotal = useMemo(() => calcModalCartTotal(cart.cart), [cart.cart]);
    const total = calcDeliveryTotal(productsTotal, delivery.domicilioNum, delivery.domicilioActivo, delivery.customerPays);
    const domicilioExcedeTotal =
        delivery.domicilioActivo && !delivery.customerPays && delivery.domicilioNum > productsTotal && productsTotal > 0;
    const hasAnything = cart.cart.length > 0 || (delivery.domicilioActivo && delivery.domicilioNum > 0);

    // Toque directo sobre una card (fuera de los chips/toggle $): productos por unidad se
    // agregan directo (sin báscula ni cálculo de peso). Productos por peso/volumen leen la
    // báscula en vivo en ese mismo toque si ya está enlazada; si no está enlazada, o si la
    // lectura falla (báscula desconectada/apagada), cae al peso rápido por defecto en vez de
    // dejar el toque sin efecto — el cajero siempre puede agregar algo y ajustar después.
    const handleCardTap = async (product: IProduct) => {
        if (!isWeightUnit(product.unidad_medida)) {
            cart.addToCart(product, 1);
            return;
        }
        if (scale.scaleIsPaired) {
            const result = await scale.readScaleForCart();
            if (result.status === ScaleReadStatusEnum.Ok) {
                cart.addToCart(product, result.weightKg);
                return;
            }
            if (result.status === ScaleReadStatusEnum.Zero) return; // aviso ya mostrado junto a ScaleReadout
            cart.addToCart(product, DEFAULT_TAP_KG); // "unreachable" — fallback manual
            return;
        }
        cart.addToCart(product, DEFAULT_TAP_KG);
    };

    const order = useQuickSaleOrderLifecycle({
        resumeOrderId,
        sistemaId,
        cart: cart.cart,
        setCart: cart.setCart,
        domicilioActivo: delivery.domicilioActivo,
        domicilioNum: delivery.domicilioNum,
        customerPays: delivery.customerPays,
        applyDeliveryFromOrder: delivery.applyDeliveryFromOrder,
        resetDelivery: delivery.resetDelivery,
        navigate,
    });

    const payment = useQuickSalePayment({
        resumeOrderId,
        sistemaId,
        cart: cart.cart,
        total,
        hasAnything,
        domicilioExcedeTotal,
        domicilioActivo: delivery.domicilioActivo,
        domicilioNum: delivery.domicilioNum,
        customerPays: delivery.customerPays,
        nombrePedido: order.nombrePedido,
        resetAfterSuccess: () => {
            cart.setCart([]);
            order.setNombrePedido("");
            delivery.resetDelivery();
        },
        navigate,
    });

    return {
        ...catalog,
        ...scale,
        resumeOrderId,
        ...cart,
        handleCardTap,
        ...delivery,
        total,
        productsTotal,
        ...order,
        ...payment,
    };
};

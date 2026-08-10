import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { IProduct } from "@/models/IProduct";
import { isWeightUnit } from "@/utils/weightUnits";
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
    // agregan directo (sin báscula ni cálculo de peso). Productos por peso/volumen aplican
    // el peso de báscula en espera si existe, o el peso rápido por defecto de la card.
    const handleCardTap = (product: IProduct) => {
        if (!isWeightUnit(product.unidad_medida)) {
            cart.addToCart(product, 1);
            return;
        }
        if (scale.stagedWeightKg !== null) {
            cart.addToCart(product, scale.stagedWeightKg);
            scale.clearStagedWeight();
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

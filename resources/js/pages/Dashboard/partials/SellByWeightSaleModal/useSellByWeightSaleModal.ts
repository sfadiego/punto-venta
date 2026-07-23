import { useState, useMemo, useEffect, useRef } from "react";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useIndexProducts } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useShowOrder } from "@/services/useOrderService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { useCustomerList } from "@/services/useCustomerService";
import { axiosPOST, axiosPUT, axiosDELETE } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IProduct } from "@/models/IProduct";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { calcDeliveryTotal, calcCostoDomicilio } from "@/utils/deliveryCalc";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";

export type ModalCartItem = {
    orderProductId: number;
    productId: number;
    product: IProduct;
    cantidad: number;
    // precio real guardado en order_product (puede diferir del catálogo en modo precio)
    precioEfectivo: number;
};

function mapOrderProducts(orderProducts: IOrderProduct[]): ModalCartItem[] {
    return (orderProducts ?? [])
        .filter((op) => op.product != null && op.producto_id != null)
        .map((op) => ({
            orderProductId: op.id!,
            productId: op.producto_id!,
            product: op.product,
            cantidad: parseFloat(String(op.cantidad)),
            precioEfectivo: parseFloat(String(op.precio)),
        }));
}

export const useSellByWeightSaleModal = (onClose: () => void, initialOrder?: IOrder) => {
    const { sistemaId, axiosApi, features } = useAxios();
    const queryClient = useQueryClient();
    const sellByWeight = features?.sell_by_weight === true;
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();

    // Use a ref for orderId so async callbacks always have the latest value
    const orderIdRef = useRef<number | null>(initialOrder?.id ?? null);
    const [orderId, setOrderIdState] = useState<number | null>(initialOrder?.id ?? null);
    const setOrderId = (id: number | null) => {
        orderIdRef.current = id;
        setOrderIdState(id);
    };

    const [nombrePedido, setNombrePedido] = useState(initialOrder?.nombre_pedido ?? "");

    const handleNombreBlur = async () => {
        const oid = orderIdRef.current;
        if (!oid || !nombrePedido.trim()) return;
        try {
            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}`,
                data: { nombre_pedido: nombrePedido.trim() },
            });
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.handleNombreBlur");
        }
    };
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<ModalCartItem[]>([]);
    const [editingQtys, setEditingQtys] = useState<Record<number, string>>({});
    const [editingPrices, setEditingPrices] = useState<Record<number, string>>({});
    const [itemModes, setItemModes] = useState<Record<number, WeightInputModeEnum>>({});

    // Refs to always access latest values in async handlers (avoid stale closures)
    const cartRef = useRef<ModalCartItem[]>([]);
    const itemModesRef = useRef<Record<number, WeightInputModeEnum>>({});
    const editingPricesRef = useRef<Record<number, string>>({});
    cartRef.current = cart;
    itemModesRef.current = itemModes;
    editingPricesRef.current = editingPrices;
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const removingRef = useRef(new Set<number>());
    const addingRef = useRef(new Set<number>());

    const rawInitialDomicilio = Number(initialOrder?.costo_domicilio ?? 0);
    const initialDomicilio = Math.abs(rawInitialDomicilio);
    const initialDeliveryActive = initialDomicilio > 0;
    const initialPaidBy = rawInitialDomicilio >= 0 ? DeliveryPaidByEnum.Customer : DeliveryPaidByEnum.Business;

    const [domicilioActivo, setDomicilioActivo] = useState(initialDeliveryActive);
    const [costoDomicilio, setCostoDomicilio] = useState<string>(
        initialDeliveryActive ? String(initialDomicilio) : "",
    );
    const [orderDeliveryPaidBy, setOrderDeliveryPaidBy] = useState<DeliveryPaidByEnum>(initialPaidBy);

    const [showPayModal, setShowPayModal] = useState(false);
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [isPaying, setIsPaying] = useState(false);
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { data: customers = [] } = useCustomerList();

    // Load full order with products only for resume mode
    const { data: fullOrder, isLoading: loadingFullOrder } = useShowOrder(
        initialOrder ? (orderId ?? 0) : 0,
    );

    useEffect(() => {
        if (fullOrder?.order_products && initialOrder) {
            const items = mapOrderProducts(fullOrder.order_products);
            setCart(items);
            // Infer price mode: weight products where stored price differs from catalog price
            const modes: Record<number, WeightInputModeEnum> = {};
            items.forEach((item) => {
                const isWeightUnit =
                    item.product.unidad_medida === UnidadMedidaEnum.Kg ||
                    item.product.unidad_medida === UnidadMedidaEnum.Gr;
                if (isWeightUnit && item.precioEfectivo !== item.product.precio) {
                    modes[item.productId] = WeightInputModeEnum.Price;
                }
            });
            setItemModes(modes);
        }
    }, [fullOrder, initialOrder]);

    const { data: productsData, isLoading: productsLoading } = useIndexProducts({
        page: 1,
        limit: 100,
        order: "asc",
    });
    const { data: categories } = useIndexCategories();

    const products = useMemo(() => {
        let all = productsData?.data?.filter((p) => p.activo) ?? [];
        if (selectedCategory !== null) all = all.filter((p) => p.categoria_id === selectedCategory);
        if (!search.trim()) return all;
        const q = search.toLowerCase();
        return all.filter((p) => p.nombre.toLowerCase().includes(q));
    }, [productsData, search, selectedCategory]);

    const total = useMemo(
        () => cart.reduce((sum, item) => sum + item.precioEfectivo * item.cantidad, 0),
        [cart],
    );

    const domicilio = parseFloat(costoDomicilio) || 0;
    const customerPays = orderDeliveryPaidBy === DeliveryPaidByEnum.Customer;
    const totalFinal = calcDeliveryTotal(total, domicilio, domicilioActivo, customerPays);
    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - totalFinal;
    const selectedPaymentMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedPaymentMethod || selectedPaymentMethod.name.toLowerCase().includes("efectivo");
    const domicilioExcedeTotal = domicilioActivo && !customerPays && domicilio > total && total > 0;
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
    const canPay = isCreditMode
        ? !domicilioExcedeTotal && totalFinal > 0 && !!selectedCustomer && selectedCustomer.allow_credit
        : !domicilioExcedeTotal && (isCashMethod
            ? cashNum >= totalFinal && totalFinal > 0
            : totalFinal > 0);

    const defaultCantidad = (product: IProduct) =>
        product.unidad_medida === UnidadMedidaEnum.Kg ? 0.5 : 1;

    const isPesoProduct = (product: IProduct) =>
        product.unidad_medida === UnidadMedidaEnum.Kg || product.unidad_medida === UnidadMedidaEnum.Gr;

    const getItemMode = (productId: number, product: IProduct): WeightInputModeEnum =>
        isPesoProduct(product) ? (itemModes[productId] ?? WeightInputModeEnum.Weight) : WeightInputModeEnum.Weight;

    const toggleItemMode = (productId: number, orderProductId: number, product: IProduct) => {
        if (!isPesoProduct(product)) return;
        const current = getItemMode(productId, product);
        setItemModes(prev => ({
            ...prev,
            [productId]: current === WeightInputModeEnum.Weight ? WeightInputModeEnum.Price : WeightInputModeEnum.Weight,
        }));
        setEditingQtys(prev => { const n = { ...prev }; delete n[orderProductId]; return n; });
        setEditingPrices(prev => { const n = { ...prev }; delete n[orderProductId]; return n; });
    };

    // En modo precio el display usa precioEfectivo × cantidad del item (siempre exacto)
    const getDisplayPrice = (orderProductId: number, item: ModalCartItem): string =>
        editingPrices[orderProductId] !== undefined
            ? editingPrices[orderProductId]
            : (item.precioEfectivo * item.cantidad).toFixed(2);

    const handlePriceChange = (orderProductId: number, value: string) => {
        setEditingPrices(prev => ({ ...prev, [orderProductId]: value }));
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) return;
        // cantidad=1, precioEfectivo=price → line_total = price exacto, sin división
        setCart(prev => prev.map(i =>
            i.orderProductId === orderProductId ? { ...i, cantidad: 1, precioEfectivo: price } : i
        ));
    };

    const handlePriceBlur = async (orderProductId: number) => {
        const oid = orderIdRef.current;
        if (!oid) return;
        const priceStr = editingPricesRef.current[orderProductId];
        if (priceStr === undefined) return;
        const price = parseFloat(priceStr) || 0;
        setEditingPrices(prev => { const n = { ...prev }; delete n[orderProductId]; return n; });

        if (price <= 0) {
            await removeFromCart(orderProductId);
            return;
        }

        const item = cart.find(i => i.orderProductId === orderProductId);
        if (!item) return;

        setCart(prev => prev.map(i =>
            i.orderProductId === orderProductId ? { ...i, cantidad: 1, precioEfectivo: price } : i
        ));

        try {
            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/product/${item.orderProductId}`,
                data: { cantidad: 1, precio: price },
            });
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.handlePriceBlur");
            toast.error("Error al actualizar precio");
        }
    };

    const ensureOrderCreated = async (): Promise<number> => {
        const existing = orderIdRef.current;
        if (existing) return existing;

        setIsCreatingOrder(true);
        try {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, "0");
            const fallback = `VTA-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
            const res = await axiosPOST(axiosApi, {
                url: ApiRoutes.Orders,
                data: {
                    nombre_pedido: nombrePedido.trim() || fallback,
                    total: 0,
                    subtotal: 0,
                    descuento: 0,
                    sistema_id: sistemaId,
                    estatus_pedido_id: OrderStatusEnum.InProcess,
                },
            });
            const newId = (res as { data: { data: IOrder } }).data.data.id;
            setOrderId(newId);
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
            return newId;
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const addToCart = async (product: IProduct) => {
        if (addingRef.current.has(product.id)) return;
        addingRef.current.add(product.id);
        try {
            const oid = await ensureOrderCreated();
            const existing = cartRef.current.find((i) => i.productId === product.id);

            if (existing) {
                const newQty = existing.cantidad + defaultCantidad(product);
                await axiosPUT(axiosApi, {
                    url: `${ApiRoutes.Orders}/${oid}/product/${existing.orderProductId}`,
                    data: { cantidad: newQty, precio: existing.precioEfectivo },
                });
                setCart((prev) =>
                    prev.map((i) =>
                        i.orderProductId === existing.orderProductId ? { ...i, cantidad: newQty } : i,
                    ),
                );
                return;
            }

            const res = await axiosPOST(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/product`,
                data: {
                    producto_id: product.id,
                    cantidad: defaultCantidad(product),
                    precio: product.precio,
                    descuento: 0,
                },
            });
            const op = (res as { data: { data: IOrderProduct } }).data.data;
            setCart((prev) => [...prev, {
                orderProductId: op.id!,
                productId: product.id,
                product,
                cantidad: parseFloat(String(op.cantidad)),
                precioEfectivo: product.precio,
            }]);
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.addToCart");
            toast.error("Error al agregar producto");
        } finally {
            addingRef.current.delete(product.id);
        }
    };

    const removeFromCart = async (orderProductId: number): Promise<void> => {
        const oid = orderIdRef.current;
        if (!oid || removingRef.current.has(orderProductId)) return;
        const item = cart.find((i) => i.orderProductId === orderProductId);
        if (!item) return;
        removingRef.current.add(orderProductId);
        try {
            await axiosDELETE(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/extra/${item.orderProductId}`,
            });
            setCart((prev) => prev.filter((i) => i.orderProductId !== orderProductId));
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.removeFromCart");
            toast.error("Error al eliminar producto");
            throw error;
        } finally {
            removingRef.current.delete(orderProductId);
        }
    };

    const clearCart = async () => {
        const oid = orderIdRef.current;
        if (!oid || cart.length === 0) return;
        const toDelete = cart.filter((item) => !removingRef.current.has(item.orderProductId));
        const results = await Promise.allSettled(
            toDelete.map((item) =>
                axiosDELETE(axiosApi, { url: `${ApiRoutes.Orders}/${oid}/extra/${item.orderProductId}` }),
            ),
        );
        results.forEach((result) => {
            if (result.status === "rejected") {
                logUnexpectedError(result.reason, "useSellByWeightSaleModal.clearCart");
            }
        });
        setCart([]);
    };

    // Quantity editing: local state for display, API call on blur
    const getDisplayQty = (orderProductId: number, cantidad: number) =>
        editingQtys[orderProductId] !== undefined ? editingQtys[orderProductId] : String(cantidad);

    const handleQtyChange = (orderProductId: number, value: string) => {
        setEditingQtys((prev) => ({ ...prev, [orderProductId]: value }));
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            setCart((prev) =>
                prev.map((i) => i.orderProductId === orderProductId ? { ...i, cantidad: num } : i),
            );
        }
    };

    const handleQtyBlur = async (orderProductId: number) => {
        const oid = orderIdRef.current;
        if (!oid) return;
        const value = editingQtys[orderProductId];
        if (value === undefined) return;
        const qty = parseFloat(value) || 0;
        setEditingQtys((prev) => { const n = { ...prev }; delete n[orderProductId]; return n; });
        if (qty <= 0) {
            await removeFromCart(orderProductId);
            return;
        }
        const item = cart.find(i => i.orderProductId === orderProductId);
        if (!item) return;
        const catalogPrice = item.product.precio ?? 0;
        setCart(prev => prev.map(i =>
            i.orderProductId === orderProductId ? { ...i, cantidad: qty, precioEfectivo: catalogPrice } : i
        ));
        try {
            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/product/${item.orderProductId}`,
                data: { cantidad: qty, precio: catalogPrice },
            });
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.handleQtyBlur");
            toast.error("Error al actualizar cantidad");
        }
    };

    const toggleDomicilio = (checked: boolean) => {
        setDomicilioActivo(checked);
        if (checked) {
            const defaultCost = businessConfig?.costo_domicilio_default ?? 0;
            setCostoDomicilio(defaultCost > 0 ? String(defaultCost) : "");
            setOrderDeliveryPaidBy(DeliveryPaidByEnum.Customer);
        } else {
            setCostoDomicilio("");
        }
    };

    const printTicket = async (oid: number) => {
        try {
            if (agentConnected) {
                const url = ApiRoutes.PrintBytes.replace(":id", String(oid));
                const res = await axiosApi.get(url, { responseType: "arraybuffer" });
                await agentPrint(new Uint8Array(res.data as ArrayBuffer));
            } else {
                await axiosPOST(axiosApi, { url: `${ApiRoutes.Orders}/${oid}/print`, data: {} });
            }
            toast.success("Ticket impreso");
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.printTicket");
            toast.error("Error al imprimir ticket");
        }
    };

    const invalidateOrderQueries = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        if (sistemaId) {
            queryClient.invalidateQueries({
                queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`],
            });
        }
    };

    const handleClose = async () => {
        const oid = orderIdRef.current;

        // No order created yet: nothing to clean up
        if (!oid) {
            onClose();
            return;
        }

        // No products: delete the empty order silently
        if (cartRef.current.length === 0) {
            try {
                await axiosDELETE(axiosApi, { url: `${ApiRoutes.Orders}/${oid}` });
            } catch (error) {
                logUnexpectedError(error, "useSellByWeightSaleModal.handleClose.deleteEmpty");
            }
        } else {
            // Flush only price-mode items that have an unblurred pending edit.
            // Items already blurred are saved by handlePriceBlur; flushing them again
            // risks sending stale state if the ref hasn't updated after the blur yet.
            const priceModeFlush = cartRef.current
                .filter((item) => {
                    const pending = editingPricesRef.current[item.orderProductId];
                    return itemModesRef.current[item.productId] === WeightInputModeEnum.Price && pending !== undefined;
                })
                .map((item) => {
                    const pending = editingPricesRef.current[item.orderProductId]!;
                    const price = parseFloat(pending) || (item.precioEfectivo * item.cantidad);
                    return axiosPUT(axiosApi, {
                        url: `${ApiRoutes.Orders}/${oid}/product/${item.orderProductId}`,
                        data: { cantidad: 1, precio: price },
                    }).catch((err) =>
                        logUnexpectedError(err, "useSellByWeightSaleModal.handleClose.flushPriceMode"),
                    );
                });
            if (priceModeFlush.length > 0) await Promise.all(priceModeFlush);

            // Persist delivery state so it restores correctly on resume
            try {
                await axiosPUT(axiosApi, {
                    url: `${ApiRoutes.Orders}/${oid}`,
                    data: {
                        costo_domicilio: domicilioActivo
                            ? calcCostoDomicilio(domicilio, domicilioActivo, customerPays)
                            : 0,
                    },
                });
            } catch (error) {
                logUnexpectedError(error, "useSellByWeightSaleModal.handleClose.saveDelivery");
            }
        }

        // Has products (or resume mode): leave as InProcess, refresh list
        invalidateOrderQueries();
        onClose();
    };

    const handlePay = async () => {
        const oid = orderIdRef.current;
        if (!oid || !canPay) return;
        setIsPaying(true);
        try {
            const paymentData = isCreditMode
                ? { is_credit: true, customer_id: selectedCustomerId }
                : { payment_method_id: paymentMethodId };

            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}`,
                data: {
                    estatus_pedido_id: OrderStatusEnum.Closed,
                    costo_domicilio: calcCostoDomicilio(domicilio, domicilioActivo, customerPays),
                    ...paymentData,
                },
            });
            invalidateOrderQueries();
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });
            toast.success(isCreditMode ? "Venta a crédito registrada correctamente." : "Venta registrada correctamente.");
            setShowPayModal(false);
            onClose();

            if (agentConnected && businessConfig?.printer_name?.trim()) {
                const { isConfirmed } = await Swal.fire({
                    title: "¿Imprimir ticket?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#f59e0b",
                    cancelButtonColor: "#78716c",
                    confirmButtonText: "Imprimir",
                    cancelButtonText: "No, gracias",
                    reverseButtons: true,
                });
                if (isConfirmed) await printTicket(oid);
            }
        } catch (error) {
            logUnexpectedError(error, "useSellByWeightSaleModal.handlePay");
            toast.error("Error al registrar la venta.");
        } finally {
            setIsPaying(false);
        }
    };

    return {
        search, setSearch,
        nombrePedido, setNombrePedido, handleNombreBlur,
        domicilioActivo, toggleDomicilio,
        costoDomicilio, setCostoDomicilio,
        orderDeliveryPaidBy, setOrderDeliveryPaidBy,
        categories: categories ?? [],
        selectedCategory, setSelectedCategory,
        products, productsLoading,
        cart, total, totalFinal, domicilio, customerPays,
        sellByWeight,
        addToCart, removeFromCart, clearCart,
        getDisplayQty, handleQtyChange, handleQtyBlur,
        getItemMode, toggleItemMode, getDisplayPrice, handlePriceChange, handlePriceBlur,
        isCreatingOrder, handleClose,
        loadingOrder: !!initialOrder && loadingFullOrder && cart.length === 0,
        isResuming: !!initialOrder,
        showPayModal, setShowPayModal,
        cash, setCash, cashNum, change, canPay,
        paymentMethods, paymentMethodId, setPaymentMethodId, isCashMethod,
        isCreditMode, setIsCreditMode, customers, selectedCustomerId, setSelectedCustomerId,
        isPaying, handlePay,
    };
};

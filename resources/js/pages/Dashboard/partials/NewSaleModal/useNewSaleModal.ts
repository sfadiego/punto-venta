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
import { axiosPOST, axiosPUT, axiosDELETE } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IProduct } from "@/models/IProduct";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

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

export const useNewSaleModal = (onClose: () => void, initialOrder?: IOrder) => {
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
            logUnexpectedError(error, "useNewSaleModal.handleNombreBlur");
        }
    };
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<ModalCartItem[]>([]);
    const [editingQtys, setEditingQtys] = useState<Record<number, string>>({});
    const [editingPrices, setEditingPrices] = useState<Record<number, string>>({});
    const [itemModes, setItemModes] = useState<Record<number, 'weight' | 'price'>>({});
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const initialDomicilio = Number(initialOrder?.costo_domicilio ?? 0);
    const [domicilioActivo, setDomicilioActivo] = useState(initialDomicilio > 0);
    const [costoDomicilio, setCostoDomicilio] = useState<string>(
        initialDomicilio > 0 ? String(initialDomicilio) : "",
    );
    const [orderDeliveryPaidBy, setOrderDeliveryPaidBy] = useState<"customer" | "business">("customer");

    const [showPayModal, setShowPayModal] = useState(false);
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    const { data: paymentMethods = [] } = useIndexPaymentMethods();

    // Load full order with products only for resume mode
    const { data: fullOrder, isLoading: loadingFullOrder } = useShowOrder(
        initialOrder ? (orderId ?? 0) : 0,
    );

    useEffect(() => {
        if (fullOrder?.order_products && initialOrder) {
            setCart(mapOrderProducts(fullOrder.order_products));
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
    const customerPays = orderDeliveryPaidBy === "customer";
    const totalFinal = domicilioActivo && domicilio > 0
        ? (customerPays ? total + domicilio : total - domicilio)
        : total;
    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - totalFinal;
    const selectedPaymentMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedPaymentMethod || selectedPaymentMethod.name.toLowerCase().includes("efectivo");
    const canPay = isCashMethod
        ? cashNum >= totalFinal && totalFinal > 0
        : totalFinal > 0;

    const defaultCantidad = (product: IProduct) =>
        product.unidad_medida === UnidadMedidaEnum.Kg ? 0.5 : 1;

    const isPesoProduct = (product: IProduct) =>
        product.unidad_medida === UnidadMedidaEnum.Kg || product.unidad_medida === UnidadMedidaEnum.Gr;

    const getItemMode = (productId: number, product: IProduct): 'weight' | 'price' =>
        isPesoProduct(product) ? (itemModes[productId] ?? 'weight') : 'weight';

    const toggleItemMode = (productId: number, product: IProduct) => {
        if (!isPesoProduct(product)) return;
        const current = getItemMode(productId, product);
        setItemModes(prev => ({ ...prev, [productId]: current === 'weight' ? 'price' : 'weight' }));
        setEditingQtys(prev => { const n = { ...prev }; delete n[productId]; return n; });
        setEditingPrices(prev => { const n = { ...prev }; delete n[productId]; return n; });
    };

    // En modo precio el display usa precioEfectivo × cantidad del item (siempre exacto)
    const getDisplayPrice = (productId: number, item: ModalCartItem): string =>
        editingPrices[productId] !== undefined
            ? editingPrices[productId]
            : (item.precioEfectivo * item.cantidad).toFixed(2);

    const handlePriceChange = (productId: number, value: string) => {
        setEditingPrices(prev => ({ ...prev, [productId]: value }));
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) return;
        // cantidad=1, precioEfectivo=price → line_total = price exacto, sin división
        setCart(prev => prev.map(i =>
            i.productId === productId ? { ...i, cantidad: 1, precioEfectivo: price } : i
        ));
    };

    const handlePriceBlur = async (productId: number) => {
        const oid = orderIdRef.current;
        if (!oid) return;
        const priceStr = editingPrices[productId];
        if (priceStr === undefined) return;
        const price = parseFloat(priceStr) || 0;
        setEditingPrices(prev => { const n = { ...prev }; delete n[productId]; return n; });

        if (price <= 0) {
            await removeFromCart(productId);
            return;
        }

        // cantidad=1, precio=monto — backend: 1 × price = price exacto
        setCart(prev => prev.map(i =>
            i.productId === productId ? { ...i, cantidad: 1, precioEfectivo: price } : i
        ));

        try {
            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/product/${productId}`,
                data: { cantidad: 1, precio: price },
            });
        } catch (error) {
            logUnexpectedError(error, "useNewSaleModal.handlePriceBlur");
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
        try {
            const oid = await ensureOrderCreated();
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
            setCart((prev) => {
                const existing = prev.find((i) => i.productId === product.id);
                if (existing) {
                    return prev.map((i) =>
                        i.productId === product.id
                            ? { ...i, cantidad: i.cantidad + defaultCantidad(product), orderProductId: op.id! }
                            : i,
                    );
                }
                return [...prev, {
                    orderProductId: op.id!,
                    productId: product.id,
                    product,
                    cantidad: parseFloat(String(op.cantidad)),
                    precioEfectivo: product.precio,
                }];
            });
        } catch (error) {
            logUnexpectedError(error, "useNewSaleModal.addToCart");
            toast.error("Error al agregar producto");
        }
    };

    const removeFromCart = async (productId: number) => {
        const oid = orderIdRef.current;
        if (!oid) return;
        const item = cart.find((i) => i.productId === productId);
        if (!item) return;
        try {
            await axiosDELETE(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/extra/${item.orderProductId}`,
            });
            setCart((prev) => prev.filter((i) => i.productId !== productId));
        } catch (error) {
            logUnexpectedError(error, "useNewSaleModal.removeFromCart");
            toast.error("Error al eliminar producto");
        }
    };

    const clearCart = async () => {
        const oid = orderIdRef.current;
        if (!oid || cart.length === 0) return;
        try {
            await Promise.all(
                cart.map((item) =>
                    axiosDELETE(axiosApi, { url: `${ApiRoutes.Orders}/${oid}/extra/${item.orderProductId}` }),
                ),
            );
            setCart([]);
        } catch (error) {
            logUnexpectedError(error, "useNewSaleModal.clearCart");
            toast.error("Error al limpiar carrito");
        }
    };

    // Quantity editing: local state for display, API call on blur
    const getDisplayQty = (productId: number, cantidad: number) =>
        editingQtys[productId] !== undefined ? editingQtys[productId] : String(cantidad);

    const handleQtyChange = (productId: number, value: string) => {
        setEditingQtys((prev) => ({ ...prev, [productId]: value }));
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            setCart((prev) =>
                prev.map((i) => i.productId === productId ? { ...i, cantidad: num } : i),
            );
        }
    };

    const handleQtyBlur = async (productId: number) => {
        const oid = orderIdRef.current;
        if (!oid) return;
        const value = editingQtys[productId];
        if (value === undefined) return;
        const qty = parseFloat(value) || 0;
        setEditingQtys((prev) => { const n = { ...prev }; delete n[productId]; return n; });
        if (qty <= 0) {
            await removeFromCart(productId);
            return;
        }
        const item = cart.find(i => i.productId === productId);
        const catalogPrice = item?.product.precio ?? 0;
        // Restaura precio de catálogo por si el item estuvo en modo precio antes
        setCart(prev => prev.map(i =>
            i.productId === productId ? { ...i, cantidad: qty, precioEfectivo: catalogPrice } : i
        ));
        try {
            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}/product/${productId}`,
                data: { cantidad: qty, precio: catalogPrice },
            });
        } catch (error) {
            logUnexpectedError(error, "useNewSaleModal.handleQtyBlur");
            toast.error("Error al actualizar cantidad");
        }
    };

    const toggleDomicilio = (checked: boolean) => {
        setDomicilioActivo(checked);
        if (checked) {
            const defaultCost = businessConfig?.costo_domicilio_default ?? 0;
            setCostoDomicilio(defaultCost > 0 ? String(defaultCost) : "");
            setOrderDeliveryPaidBy("customer");
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
            logUnexpectedError(error, "useNewSaleModal.printTicket");
            toast.error("Error al imprimir ticket");
        }
    };

    const invalidateOrderQueries = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    };

    const handleClose = async () => {
        const oid = orderIdRef.current;

        // No order created yet: nothing to clean up
        if (!oid) {
            onClose();
            return;
        }

        // No products: delete the empty order silently
        if (cart.length === 0) {
            try {
                await axiosDELETE(axiosApi, { url: `${ApiRoutes.Orders}/${oid}` });
            } catch (error) {
                logUnexpectedError(error, "useNewSaleModal.handleClose.deleteEmpty");
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
            await axiosPUT(axiosApi, {
                url: `${ApiRoutes.Orders}/${oid}`,
                data: {
                    estatus_pedido_id: OrderStatusEnum.Closed,
                    costo_domicilio: domicilioActivo && domicilio > 0 && !customerPays ? domicilio : 0,
                    payment_method_id: paymentMethodId,
                },
            });
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
            toast.success("Venta registrada correctamente.");
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
            logUnexpectedError(error, "useNewSaleModal.handlePay");
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
        isPaying, handlePay,
    };
};

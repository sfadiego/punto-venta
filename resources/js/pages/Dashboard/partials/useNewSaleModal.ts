import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useIndexProducts } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useNewSale, ICartItem } from "@/services/useNewSaleService";
import { axiosPOST } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IProduct } from "@/models/IProduct";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export const useNewSaleModal = (onClose: () => void) => {
    const { sistemaId, axiosApi, features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();

    const [search, setSearch] = useState("");
    const [nombrePedido, setNombrePedido] = useState("");
    const [domicilioActivo, setDomicilioActivo] = useState(false);
    const [costoDomicilio, setCostoDomicilio] = useState<string>("");
    const [orderDeliveryPaidBy, setOrderDeliveryPaidBy] = useState<'customer' | 'business'>('customer');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<ICartItem[]>([]);

    const toggleDomicilio = (checked: boolean) => {
        setDomicilioActivo(checked);
        if (checked) {
            const defaultCost = businessConfig?.costo_domicilio_default ?? 0;
            setCostoDomicilio(defaultCost > 0 ? String(defaultCost) : "");
            setOrderDeliveryPaidBy(businessConfig?.delivery_paid_by ?? 'customer');
        } else {
            setCostoDomicilio("");
        }
    };

    const { data: productsData, isLoading: productsLoading } = useIndexProducts({
        page: 1,
        limit: 100,
        order: "asc",
    });
    const { data: categories } = useIndexCategories();

    const mutation = useNewSale();

    const products = useMemo(() => {
        let all = productsData?.data?.filter((p) => p.activo) ?? [];
        if (selectedCategory !== null) all = all.filter((p) => p.categoria_id === selectedCategory);
        if (!search.trim()) return all;
        const q = search.toLowerCase();
        return all.filter((p) => p.nombre.toLowerCase().includes(q));
    }, [productsData, search, selectedCategory]);

    const total = useMemo(
        () => cart.reduce((sum, item) => sum + item.product.precio * item.cantidad, 0),
        [cart],
    );

    const defaultCantidad = (product: IProduct) =>
        product.unidad_medida === UnidadMedidaEnum.Kg ? 0.5 : 1;

    const addToCart = (product: IProduct) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product.id === product.id
                        ? { ...i, cantidad: i.cantidad + defaultCantidad(product) }
                        : i,
                );
            }
            return [...prev, { product, cantidad: defaultCantidad(product) }];
        });
    };

    const updateCantidad = (productId: number, cantidad: number) => {
        if (cantidad <= 0) {
            setCart((prev) => prev.filter((i) => i.product.id !== productId));
            return;
        }
        setCart((prev) =>
            prev.map((i) => (i.product.id === productId ? { ...i, cantidad } : i)),
        );
    };

    const removeFromCart = (productId: number) =>
        setCart((prev) => prev.filter((i) => i.product.id !== productId));

    const clearCart = () => setCart([]);

    const printOrder = async (orderId: number) => {
        if (!businessConfig?.printer_name?.trim()) {
            toast.warning("Impresora no configurada. Ve a Configuración → Impresora para agregarla.");
            return;
        }

        try {
            if (agentConnected) {
                const url = ApiRoutes.PrintBytes.replace(":id", String(orderId));
                const res = await axiosApi.get(url, { responseType: "arraybuffer" });
                await agentPrint(new Uint8Array(res.data as ArrayBuffer));
                toast.success("Ticket impreso");
            } else {
                await axiosPOST(axiosApi, {
                    url: `${ApiRoutes.Orders}/${orderId}/print`,
                    data: {},
                });
                toast.success("Ticket enviado a la impresora");
            }
        } catch {
            toast.error("Error al imprimir el ticket");
        }
    };

    const handleSubmit = async () => {
        if (!sistemaId || cart.length === 0) return;
        try {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, "0");
            const fallback = `VTA-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            const res = await mutation.mutateAsync({
                sistemaId,
                nombrePedido: nombrePedido.trim() || fallback,
                costoDomicilio: parseFloat(costoDomicilio) || 0,
                items: cart,
            });
            const orderId: number = (res as any).data.data.id;
            toast.success("Venta registrada correctamente.");
            onClose();
            await printOrder(orderId);
        } catch {
            toast.error("Error al registrar la venta.");
        }
    };

    return {
        search,
        setSearch,
        nombrePedido,
        setNombrePedido,
        domicilioActivo,
        toggleDomicilio,
        costoDomicilio,
        setCostoDomicilio,
        orderDeliveryPaidBy,
        setOrderDeliveryPaidBy,
        categories: categories ?? [],
        selectedCategory,
        setSelectedCategory,
        products,
        productsLoading,
        cart,
        total,
        addToCart,
        updateCantidad,
        removeFromCart,
        clearCart,
        sellByWeight,
        handleSubmit,
        isPending: mutation.isPending,
    };
};

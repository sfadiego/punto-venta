import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";
import { axiosPOST } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IProduct } from "@/models/IProduct";

export interface ICartItem {
    product: IProduct;
    cantidad: number;
}

interface NewSalePayload {
    sistemaId: number;
    nombrePedido: string;
    costoDomicilio: number;
    items: ICartItem[];
}

export const useNewSale = () => {
    const { axiosApi } = useAxios();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ sistemaId, nombrePedido, costoDomicilio, items }: NewSalePayload) =>
            axiosPOST(axiosApi, {
                url: `${ApiRoutes.Orders}/sale`,
                data: {
                    sistema_id:       sistemaId,
                    nombre_pedido:    nombrePedido,
                    costo_domicilio:  costoDomicilio,
                    items: items.map((i) => ({
                        producto_id: i.product.id,
                        cantidad:    i.cantidad,
                        precio:      i.product.precio,
                    })),
                },
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders-infinite"] });
            qc.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
        },
    });
};

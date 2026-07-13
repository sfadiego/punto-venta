import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

const base = (slug: string) => `/api/menu/${slug}`;

export interface IMenuBusiness {
    business_name: string;
    primary_color: string;
    logo: string | null;
    costo_domicilio_default: number;
    has_active_session: boolean;
    menu_enabled: boolean;
}

export interface IMenuProduct {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    image_url: string | null;
}

export interface IMenuCategory {
    id: number;
    nombre: string;
    icon: string | null;
    products: IMenuProduct[];
}

export interface IMenuProductsPage {
    data: IMenuCategory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface IPublicOrderItem {
    product_id: number;
    cantidad: number;
}

export interface IPublicOrderPayload {
    customer_name: string;
    customer_phone: string;
    is_delivery: boolean;
    delivery_address: string | null;
    delivery_reference: string | null;
    items: IPublicOrderItem[];
}

export const useGetMenuBusiness = (slug: string) =>
    useQuery<IMenuBusiness>({
        queryKey: ["menu-business", slug],
        queryFn: async () => {
            const res = await axios.get(base(slug));
            return res.data.data;
        },
    });

export const useInfiniteMenuProducts = (slug: string) =>
    useInfiniteQuery<IMenuProductsPage>({
        queryKey: ["menu-products", slug],
        queryFn: async ({ pageParam }) => {
            const res = await axios.get(`${base(slug)}/products`, {
                params: { page: pageParam },
            });
            return res.data as IMenuProductsPage;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
    });

export const useCreatePublicOrder = (slug: string) =>
    useMutation({
        mutationFn: (payload: IPublicOrderPayload) =>
            axios.post(`${base(slug)}/order`, payload),
    });

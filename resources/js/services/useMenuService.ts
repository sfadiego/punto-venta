import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import type {
    IMenuBusiness,
    IMenuProductsPage,
    IPublicOrderPayload,
} from "@/models/IMenu";

export type { IMenuBusiness, IMenuProduct, IMenuCategory, IMenuProductsPage, IPublicOrderItem, IPublicOrderPayload } from "@/models/IMenu";

const base = (slug: string) => `/api/menu/${slug}`;

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
                params: { page: pageParam, limit: 100 },
            });
            return res.data as IMenuProductsPage;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
    });

export interface IMenuCustomerLookup {
    customer_name: string;
    delivery_address: string | null;
    delivery_reference: string | null;
}

export const useGetMenuCustomerByPhone = (slug: string, phone: string) =>
    useQuery<IMenuCustomerLookup | null>({
        queryKey: ["menu-customer", slug, phone],
        queryFn: async () => {
            const res = await axios.get(`${base(slug)}/customer`, { params: { phone } });
            return res.data.data ?? null;
        },
        enabled: /^\+?[\d]{10,12}$/.test(phone),
        staleTime: 30_000,
    });

export const useCreatePublicOrder = (slug: string) =>
    useMutation({
        mutationFn: (payload: IPublicOrderPayload) =>
            axios.post(`${base(slug)}/order`, payload),
    });

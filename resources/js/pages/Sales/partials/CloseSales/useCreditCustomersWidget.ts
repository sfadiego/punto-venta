import { useCreditCustomers } from "@/services/useCreditCustomersService";

export const useCreditCustomersWidget = (sistemaId: number | null) => {
    const { data, isLoading } = useCreditCustomers(sistemaId);

    return { customers: data ?? [], isLoading };
};

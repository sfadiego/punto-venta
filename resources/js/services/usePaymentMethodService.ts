import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaymentMethod } from "@/models/IPaymentMethod";

const url = ApiRoutes.PaymentMethods;

export const useIndexPaymentMethods = () =>
    useGET<IPaymentMethod[]>({ url });

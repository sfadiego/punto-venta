import { IExpense } from "@/models/IExpense";
import { useGET, usePOST } from "../hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = ApiRoutes.System;

export const useIndexExpenses = (sistemaId: number | null) =>
    useGET<IExpense[]>({
        url: `${url}/${sistemaId}/expense`,
        enable: !!sistemaId && sistemaId > 0,
    });

export const useStoreExpense = (sistemaId: number) =>
    usePOST({ url: `${url}/${sistemaId}/expense` });

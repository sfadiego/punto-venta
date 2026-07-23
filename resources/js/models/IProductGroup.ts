import { IOrderProduct } from "./IOrderProduct";

export interface IProductGroup {
    key: string;
    name: string;
    items: IOrderProduct[];
    readyCount: number;
    totalCount: number;
    allReady: boolean;
}

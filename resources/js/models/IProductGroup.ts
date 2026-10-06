import { IOrderProduct } from "./IOrderProduct";
import { IOrderProductAddon } from "./IOrderProductAddon";

export interface IProductGroup {
    key: string;
    name: string;
    items: IOrderProduct[];
    readyCount: number;
    totalCount: number;
    totalUnits: number;
    allReady: boolean;
    /** Toppings que comparten todas las líneas del grupo (el grupo solo junta líneas con los mismos). */
    addons: IOrderProductAddon[];
}

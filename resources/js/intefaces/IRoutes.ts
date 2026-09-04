import { Action } from "@/utils/permissionUtils";
import { ReactElement } from "react";

export default interface IRoute {
    path: string;
    element: ReactElement;
    private?: boolean;
    /** Un solo permiso, o un arreglo cuando la página requiere varios a la vez (AND, no OR). */
    permission?: Action | Action[];
    layout?: string;
    publicFallback?: string;
}

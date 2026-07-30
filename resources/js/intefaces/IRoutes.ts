import { Action } from "@/utils/permissionUtils";
import { ReactElement } from "react";

export default interface IRoute {
    path: string;
    element: ReactElement;
    private?: boolean;
    permission?: Action;
    layout?: string;
    publicFallback?: string;
}

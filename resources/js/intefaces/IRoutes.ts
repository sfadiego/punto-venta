import { IUser } from "@/models/IUser";
import { ReactElement } from "react";

export default interface IRoute {
    path: string;
    element: ReactElement;
    private?: boolean;
    hasPermission?: (props: IUser) => boolean;
    layout?: string;
    publicFallback?: string;
}

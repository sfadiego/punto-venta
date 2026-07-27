import { IUser } from "@/models/IUser";
import { AxiosInstance } from "axios";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";

export interface IAuthContextType {
    authToken: string | null;
    isAuth: boolean;
    user: IUser | null;
    features: IBusinessFeatures | null;
    rolePermissions: Record<number, string[]> | null;
    axiosApi: AxiosInstance;
    saveAuth: (
        accessToken: string,
        user: IUser,
        features: IBusinessFeatures,
        rolePermissions: Record<number, string[]> | null,
        tenantSlug?: string | null,
    ) => void;
    sistemaId: number | null;
    logout: () => void;
    setSistema: (sistema: number | null) => void;
    // Refreshes the cached logged-in user (localStorage + context state) without
    // a full re-login — used when an admin edits their own profile from the
    // users list, so the sidebar reflects the change immediately.
    setCurrentUser: (user: IUser) => void;
    // Refresca el override de permisos (localStorage + context) sin re-login —
    // usado cuando el propio Admin guarda cambios en Roles y permisos.
    setRolePermissions: (rolePermissions: Record<number, string[]> | null) => void;
}

import { IUser } from "@/models/IUser";
import { AxiosInstance } from "axios";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";

export interface IAuthContextType {
    authToken: string | null;
    isAuth: boolean;
    user: IUser | null;
    features: IBusinessFeatures | null;
    axiosApi: AxiosInstance;
    saveAuth: (accessToken: string, user: IUser, features: IBusinessFeatures, tenantSlug?: string | null) => void;
    sistemaId: number | null;
    logout: () => void;
    setSistema: (sistema: number | null) => void;
    // Refreshes the cached logged-in user (localStorage + context state) without
    // a full re-login — used when an admin edits their own profile from the
    // users list, so the sidebar reflects the change immediately.
    setCurrentUser: (user: IUser) => void;
}

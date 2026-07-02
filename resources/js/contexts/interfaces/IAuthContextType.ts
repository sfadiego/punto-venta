import { IUser } from "@/models/IUser";
import { AxiosInstance } from "axios";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";

export interface IAuthContextType {
    authToken: string | null;
    isAuth: boolean;
    user: IUser | null;
    features: IBusinessFeatures | null;
    axiosApi: AxiosInstance;
    saveAuth: (accessToken: string, user: IUser, features: IBusinessFeatures) => void;
    sistemaId: number | null;
    logout: () => void;
    setSistema: (sistema: number | null) => void;
}

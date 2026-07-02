import { IUser } from "@/models/IUser";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";

export interface ISignInForm {
    email: string;
    password: string;
    slug?: string;
}

export interface IAuthResponse {
    user: IUser;
    access_token: string;
    features: IBusinessFeatures;
}

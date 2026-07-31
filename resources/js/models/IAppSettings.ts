import { AppThemeEnum } from "@/enums/AppThemeEnum";

export interface IPaymentInfo {
    bank: string;
    account: string;
    holder: string;
    concept: string;
}

export interface IAppSettings {
    logo_upload_enabled: boolean;
    payment_info: IPaymentInfo | null;
    theme: AppThemeEnum;
}

import { IBusinessConfig } from "@/models/IBusinessConfig";

const STORAGE_KEY = "businessConfig";

export const getCachedBusinessConfig = (): IBusinessConfig | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as IBusinessConfig) : null;
    } catch {
        return null;
    }
};

export const setCachedBusinessConfig = (config: IBusinessConfig): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const clearCachedBusinessConfig = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};

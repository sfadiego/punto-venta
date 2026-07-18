import axios from "axios";
import { ApisEnum } from "@/configs/apisEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";

const TOKEN_KEY = "superAdminToken";

export const superAdminAxios = axios.create({ baseURL: String(ApisEnum.BaseUrl) });

superAdminAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers.Accept = "application/json";
    return config;
});

superAdminAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            superAdminAuth.logout();
        }
        return Promise.reject(error);
    },
);

export const superAdminAuth = {
    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

    login: async (email: string, password: string): Promise<void> => {
        const res = await superAdminAxios.post(`${ApiRoutes.SuperAdminAuth}/login`, { email, password });
        const token = res.data.data.access_token as string;
        localStorage.setItem(TOKEN_KEY, token);
    },

    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.replace(SuperAdminRoutes.Login);
    },
};

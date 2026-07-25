import axios, { AxiosInstance } from "axios";
import { ApisEnum } from "./apisEnum";

const axiosApi: AxiosInstance = axios.create({
    baseURL: ApisEnum.BaseUrl.toString(),
    timeout: 20000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// TODO: revisar si esta configurado correctamente el archivo axiosContext
// Interceptor para agregar el token a las cabeceras de las peticiones
axiosApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);
export default axiosApi;

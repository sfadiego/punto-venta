import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IUser } from "@/models/IUser";

const url = ApiRoutes.SuperAdminUsers;
const QUERY_KEY = "super-admin-users";

export interface ICreateSuperAdminPayload {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    usuario: string;
    password: string;
    password_confirmation: string;
}

export interface IUpdateSuperAdminPayload {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    usuario: string;
    password?: string;
    password_confirmation?: string;
}

export const useListSuperAdmins = () =>
    useQuery<IUser[]>({
        queryKey: [QUERY_KEY],
        queryFn: async () => {
            const res = await superAdminAxios.get(url);
            return res.data.data as IUser[];
        },
    });

export const useCreateSuperAdmin = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: ICreateSuperAdminPayload) => superAdminAxios.post(url, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useUpdateSuperAdmin = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IUpdateSuperAdminPayload }) =>
            superAdminAxios.put(`${url}/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

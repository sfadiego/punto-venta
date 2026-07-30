import { useState } from "react";
import { IUser } from "@/models/IUser";
import { useListSuperAdmins } from "@/services/useSuperAdminUserService";

export const useSuperAdminUsersSection = () => {
    const { data: superAdmins = [], isLoading } = useListSuperAdmins();
    const [modalUser, setModalUser] = useState<IUser | null | undefined>(undefined);

    const openCreate = () => setModalUser(null);
    const openEdit = (user: IUser) => setModalUser(user);
    const closeModal = () => setModalUser(undefined);

    return {
        superAdmins,
        isLoading,
        modalUser,
        isModalOpen: modalUser !== undefined,
        openCreate,
        openEdit,
        closeModal,
    };
};

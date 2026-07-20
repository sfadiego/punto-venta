import { useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ICustomer } from "@/models/ICustomer";
import { useStoreCustomer } from "@/services/useCustomerService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

interface UseCustomerCreditPickerParams {
    customers: ICustomer[];
    onSelect: (id: number) => void;
}

export const useCustomerCreditPicker = ({ customers, onSelect }: UseCustomerCreditPickerParams) => {
    const [search, setSearch] = useState("");
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const { mutateAsync: storeCustomer, isPending: isCreating } = useStoreCustomer();
    const queryClient = useQueryClient();

    const filtered = search.trim()
        ? customers.filter((c) => {
            const q = search.toLowerCase();
            return c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(search.trim());
        })
        : customers;

    const openNewForm = () => setShowNewForm(true);
    const closeNewForm = () => setShowNewForm(false);

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.error("Ingresa el nombre del cliente");
            return;
        }
        try {
            const res = await storeCustomer({ name: newName.trim(), phone: newPhone.trim() || undefined });
            const created = (res as unknown as { data: { data: ICustomer } }).data.data;

            // El picker usa la lista cacheada de useCustomerList(); insertamos el nuevo
            // cliente ahí mismo para que aparezca de inmediato en la búsqueda/selección
            // sin esperar a que expire el staleTime.
            queryClient.setQueryData<ICustomer[]>([`${ApiRoutes.Customer}/list`], (prev) =>
                prev ? [...prev, created] : [created]
            );
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });

            onSelect(created.id);
            setShowNewForm(false);
            setSearch("");
            setNewName("");
            setNewPhone("");
            toast.success("Cliente creado y seleccionado");
        } catch (error) {
            logUnexpectedError(error, "useCustomerCreditPicker.handleCreate");
            toast.error("No se pudo crear el cliente");
        }
    };

    return {
        search, setSearch,
        filtered,
        showNewForm, openNewForm, closeNewForm,
        newName, setNewName,
        newPhone, setNewPhone,
        isCreating,
        handleCreate,
    };
};

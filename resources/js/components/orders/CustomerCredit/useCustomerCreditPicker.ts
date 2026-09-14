import { useState, useEffect } from "react";
import { isValidPhone, phoneValidationMessage, normalizePhone } from "@/utils/phoneUtils";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ICustomer } from "@/models/ICustomer";
import { invalidateCustomerQueries, useStoreCustomer } from "@/services/useCustomerService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
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

    const phoneRaw = newPhone.trim();
    const phoneValid = phoneRaw === "" || isValidPhone(phoneRaw);
    const phoneError = phoneRaw !== "" && !phoneValid ? phoneValidationMessage : null;

    const existingByPhone = phoneValid && phoneRaw
        ? customers.find((c) => c.phone && normalizePhone(c.phone) === normalizePhone(phoneRaw)) ?? null
        : null;

    const nameRaw = newName.trim();
    const existingByName = nameRaw
        ? customers.find((c) => c.name.trim().toLowerCase() === nameRaw.toLowerCase()) ?? null
        : null;
    // Si el teléfono ya coincidió con un cliente, el nombre coincidiendo con ese MISMO
    // cliente no es un conflicto — es el flujo esperado (el useEffect de abajo autocompleta
    // el nombre). Solo es un duplicado real si el nombre coincide con OTRO cliente distinto.
    const nameConflict = existingByName && existingByName.id !== existingByPhone?.id ? existingByName : null;
    const nameError = nameConflict ? `Ya existe un cliente con el nombre "${nameConflict.name}".` : null;

    useEffect(() => {
        if (existingByPhone) setNewName(existingByPhone.name);
    }, [existingByPhone]);

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.error("Ingresa el nombre del cliente");
            return;
        }

        if (phoneError || nameConflict) return;
        if (existingByPhone) {
            onSelect(existingByPhone.id);
            setShowNewForm(false);
            setSearch("");
            setNewName("");
            setNewPhone("");
            toast.info(`Cliente "${existingByPhone.name}" seleccionado`);
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
            invalidateCustomerQueries(queryClient);

            onSelect(created.id);
            setShowNewForm(false);
            setSearch("");
            setNewName("");
            setNewPhone("");
            toast.success("Cliente creado y seleccionado");
        } catch (error) {
            logUnexpectedError(error, "useCustomerCreditPicker.handleCreate");
            toast.error(getUserFacingErrorMessage(error, "No se pudo crear el cliente"));
        }
    };

    return {
        search, setSearch,
        filtered,
        showNewForm, openNewForm, closeNewForm,
        newName, setNewName,
        newPhone, setNewPhone,
        isCreating,
        existingByPhone,
        phoneError,
        nameError,
        handleCreate,
    };
};

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateCustomerQueries } from "@/services/useCustomerService";
import { ICustomer } from "@/models/ICustomer";
import { useAddCustomerModal } from "./partials/CustomerModals/useAddCustomerModal";
import { useEditCustomerModal } from "./partials/CustomerModals/useEditCustomerModal";

// Modales de la página: alta de cliente y edición (el cliente en edición decide si el modal está abierto).
export const useCustomerModals = () => {
    const queryClient = useQueryClient();
    const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
    const invalidateCustomers = () => invalidateCustomerQueries(queryClient);

    const add = useAddCustomerModal(invalidateCustomers);
    const edit = useEditCustomerModal(editingCustomer, invalidateCustomers, () => setEditingCustomer(null));

    return {
        add: { isOpen: add.isOpen, open: add.openModal, close: add.handleClose, formik: add.formik },
        edit: { customer: editingCustomer, start: setEditingCustomer, close: () => setEditingCustomer(null), formik: edit.formik },
    };
};

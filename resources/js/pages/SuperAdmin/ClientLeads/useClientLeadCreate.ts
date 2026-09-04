import { useState } from "react";
import { toast } from "react-toastify";
import { useCreateClientLead } from "@/services/useClientLeadService";
import { IClientLeadCreatePayload } from "@/models/IClientLead";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useClientLeadCreate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { mutateAsync: createClientLead, isPending: isSaving } = useCreateClientLead();

    const handleCreate = async (payload: IClientLeadCreatePayload) => {
        try {
            await createClientLead(payload);
            toast.success("Cliente potencial agregado correctamente");
            setIsOpen(false);
        } catch (error) {
            logUnexpectedError(error, "useClientLeadCreate.handleCreate");
            toast.error(getUserFacingErrorMessage(error, "No se pudo agregar el cliente potencial"));
        }
    };

    return {
        isCreateOpen: isOpen,
        openCreate: () => setIsOpen(true),
        closeCreate: () => setIsOpen(false),
        isCreating: isSaving,
        handleCreate,
    };
};

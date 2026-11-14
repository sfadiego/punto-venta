import { useState } from "react";
import { toast } from "react-toastify";
import { useIndexClientLeads, useUpdateClientLead } from "@/services/useClientLeadService";
import { ClientLeadStatusEnum } from "@/enums/ClientLeadStatusEnum";
import { IClientLead, IUpdateClientLeadPayload } from "@/models/IClientLead";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DEFAULT_LIMIT = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const useClientLeadsPage = () => {
    const [status, setStatus] = useState<ClientLeadStatusEnum | "">("");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const [selected, setSelected] = useState<IClientLead | null>(null);

    const { tableProps, refetch } = useServerTable({
        service: useIndexClientLeads,
        params: { status, search: debouncedSearch },
        defaultLimit: DEFAULT_LIMIT,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
    });
    const { mutateAsync: updateClientLead, isPending: isSaving } = useUpdateClientLead();

    const handleSave = async (payload: IUpdateClientLeadPayload) => {
        if (!selected) return;
        try {
            await updateClientLead({ id: selected.id, data: payload });
            toast.success("Cliente potencial actualizado correctamente");
            setSelected(null);
        } catch (error) {
            logUnexpectedError(error, "useClientLeadsPage.handleSave");
            toast.error(getUserFacingErrorMessage(error, "No se pudo actualizar el cliente potencial"));
        }
    };

    return {
        tableProps,
        totalRecords: tableProps.totalRecords,
        status,
        handleStatusFilterChange: setStatus,
        search,
        handleSearchChange: setSearch,
        refetch,
        selected,
        isSaving,
        openDetail: (clientLead: IClientLead) => setSelected(clientLead),
        closeDetail: () => setSelected(null),
        handleSave,
    };
};

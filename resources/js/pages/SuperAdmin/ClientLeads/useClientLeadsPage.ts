import { useState } from "react";
import { toast } from "react-toastify";
import { useIndexClientLeads, useUpdateClientLead } from "@/services/useClientLeadService";
import { ClientLeadStatusEnum } from "@/enums/ClientLeadStatusEnum";
import { IClientLead, IUpdateClientLeadPayload } from "@/models/IClientLead";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useClientLeadsPage = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [status, setStatus] = useState<ClientLeadStatusEnum | "">("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<IClientLead | null>(null);

    const { data, isLoading, refetch } = useIndexClientLeads({ page, limit, status, search });
    const { mutateAsync: updateClientLead, isPending: isSaving } = useUpdateClientLead();

    const records = data?.data ?? [];
    const totalRecords = data?.total ?? 0;
    const perPage = data?.per_page ?? limit;

    const handleStatusFilterChange = (value: ClientLeadStatusEnum | "") => {
        setStatus(value);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

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
        records,
        totalRecords,
        perPage,
        page,
        setPage,
        limit,
        setLimit,
        status,
        handleStatusFilterChange,
        search,
        handleSearchChange,
        isLoading,
        refetch,
        selected,
        isSaving,
        openDetail: (clientLead: IClientLead) => setSelected(clientLead),
        closeDetail: () => setSelected(null),
        handleSave,
    };
};

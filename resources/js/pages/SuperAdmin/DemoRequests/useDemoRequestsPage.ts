import { useState } from "react";
import { toast } from "react-toastify";
import { useIndexDemoRequests, useUpdateDemoRequest } from "@/services/useDemoRequestService";
import { DemoRequestStatusEnum } from "@/enums/DemoRequestStatusEnum";
import { IDemoRequest, IUpdateDemoRequestPayload } from "@/models/IDemoRequest";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const useDemoRequestsPage = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [status, setStatus] = useState<DemoRequestStatusEnum | "">("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<IDemoRequest | null>(null);

    const { data, isLoading, refetch } = useIndexDemoRequests({ page, limit, status, search });
    const { mutateAsync: updateDemoRequest, isPending: isSaving } = useUpdateDemoRequest();

    const records = data?.data ?? [];
    const totalRecords = data?.total ?? 0;
    const perPage = data?.per_page ?? limit;

    const handleStatusFilterChange = (value: DemoRequestStatusEnum | "") => {
        setStatus(value);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleSave = async (payload: IUpdateDemoRequestPayload) => {
        if (!selected) return;
        try {
            await updateDemoRequest({ id: selected.id, data: payload });
            toast.success("Solicitud actualizada correctamente");
            setSelected(null);
        } catch (error) {
            logUnexpectedError(error, "useDemoRequestsPage.handleSave");
            toast.error("No se pudo actualizar la solicitud");
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
        openDetail: (demoRequest: IDemoRequest) => setSelected(demoRequest),
        closeDetail: () => setSelected(null),
        handleSave,
    };
};

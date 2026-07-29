import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useIndexErrorLogs, usePruneErrorLogs } from "@/services/useErrorLogsService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { IErrorLog } from "@/models/IErrorLog";

const DEFAULT_PRUNE_DAYS = 90;

export const useErrorLogsPage = () => {
    const [page, setPage]           = useState(1);
    const [limit, setLimit]         = useState(20);
    const [source, setSource]       = useState<"" | "frontend" | "backend">("");
    const [selectedLog, setSelectedLog] = useState<IErrorLog | null>(null);

    const { data, isLoading, refetch } = useIndexErrorLogs({ page, limit, source });
    const { mutateAsync: pruneLogs, isPending: isPruning } = usePruneErrorLogs();

    const handlePrune = async () => {
        const result = await Swal.fire({
            title: "¿Purgar logs antiguos?",
            text: `Se eliminarán los logs con más de ${DEFAULT_PRUNE_DAYS} días de antigüedad.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, purgar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        try {
            const res = await pruneLogs(DEFAULT_PRUNE_DAYS);
            toast.success(`Se eliminaron ${res.data.deleted} registro(s).`);
            setPage(1);
            refetch();
        } catch (error) {
            logUnexpectedError(error, "useErrorLogsPage.handlePrune");
            toast.error(getUserFacingErrorMessage(error, "Error al purgar los logs."));
        }
    };

    const records      = data?.data ?? [];
    const totalRecords = data?.total ?? 0;
    const perPage      = data?.per_page ?? limit;

    const handleSourceChange = (value: "" | "frontend" | "backend") => {
        setSource(value);
        setPage(1);
    };

    return {
        records,
        totalRecords,
        perPage,
        page,
        setPage,
        limit,
        setLimit,
        source,
        handleSourceChange,
        isLoading,
        refetch,
        selectedLog,
        openDetail:  (log: IErrorLog) => setSelectedLog(log),
        closeDetail: () => setSelectedLog(null),
        handlePrune,
        isPruning,
    };
};

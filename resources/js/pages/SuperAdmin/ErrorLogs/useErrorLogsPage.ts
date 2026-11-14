import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useIndexErrorLogs, usePruneErrorLogs } from "@/services/useErrorLogsService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { IErrorLog } from "@/models/IErrorLog";
import { useServerTable } from "@/hooks/useServerTable";

const DEFAULT_PRUNE_DAYS = 90;
const DEFAULT_LIMIT = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const useErrorLogsPage = () => {
    const [source, setSource]       = useState<"" | "frontend" | "backend">("");
    const [selectedLog, setSelectedLog] = useState<IErrorLog | null>(null);

    const { tableProps, refetch } = useServerTable({
        service: useIndexErrorLogs,
        params: { source },
        defaultLimit: DEFAULT_LIMIT,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
    });
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
            refetch();
        } catch (error) {
            logUnexpectedError(error, "useErrorLogsPage.handlePrune");
            toast.error(getUserFacingErrorMessage(error, "Error al purgar los logs."));
        }
    };

    return {
        tableProps,
        totalRecords: tableProps.totalRecords,
        source,
        handleSourceChange: setSource,
        refetch,
        selectedLog,
        openDetail:  (log: IErrorLog) => setSelectedLog(log),
        closeDetail: () => setSelectedLog(null),
        handlePrune,
        isPruning,
    };
};

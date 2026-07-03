import { useState } from "react";
import { useIndexErrorLogs } from "@/services/useErrorLogsService";
import { IErrorLog } from "@/models/IErrorLog";

export const useErrorLogsPage = () => {
    const [page, setPage]           = useState(1);
    const [limit, setLimit]         = useState(20);
    const [source, setSource]       = useState<"" | "frontend" | "backend">("");
    const [selectedLog, setSelectedLog] = useState<IErrorLog | null>(null);

    const { data, isLoading, refetch } = useIndexErrorLogs({ page, limit, source });

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
    };
};

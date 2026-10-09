import { useState } from "react";
import { toast } from "react-toastify";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useFetchPrintTestBytes } from "@/services/useOrderService";
import { reportClientError } from "@/utils/reportClientError";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { getPrintErrorMessage } from "@/utils/printErrorMessage";

export const useTestPrint = () => {
    const { print } = usePrintAgent();
    const fetchPrintTestBytes = useFetchPrintTestBytes();
    const [isPending, setIsPending] = useState(false);

    const testPrint = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            const bytes = await fetchPrintTestBytes();
            await print(new Uint8Array(bytes as ArrayBuffer));
            toast.success("Impresión de prueba enviada");
        } catch (err) {
            const msg = getUserFacingErrorMessage(err, getPrintErrorMessage(err));
            const stack = err instanceof Error ? err.stack : undefined;
            toast.error(msg);
            reportClientError({ message: msg, stack, context: "print-agent-test" });
        } finally {
            setIsPending(false);
        }
    };

    return { testPrint, isPending };
};

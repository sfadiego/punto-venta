import { useState } from "react";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const useTestPrint = () => {
    const { axiosApi } = useAxios();
    const { print } = usePrintAgent();
    const [isPending, setIsPending] = useState(false);

    const testPrint = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            const res = await axiosApi.get(ApiRoutes.PrintTestBytes, {
                responseType: "arraybuffer",
            });
            await print(new Uint8Array(res.data as ArrayBuffer));
            toast.success("Impresión de prueba enviada");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error al imprimir";
            toast.error("Error: " + msg);
        } finally {
            setIsPending(false);
        }
    };

    return { testPrint, isPending };
};

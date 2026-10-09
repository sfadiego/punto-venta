import Swal from "sweetalert2";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { usePrintTicket } from "./usePrintTicket";

// Tras apartar, abonar o devolver, ofrece imprimir el comprobante (mismo criterio que el cobro normal:
// solo si el negocio tiene impresora configurada). El backend decide el formato: una orden con abonos
// imprime el comprobante de apartado con historial y saldo; con `returnId`, el de esa devolución.
export const usePrintReceiptPrompt = () => {
    const { data: businessConfig } = useGetBusinessConfig();
    const { print } = usePrintTicket();

    return async (orderId: number, returnId?: number) => {
        if (!businessConfig?.printer_host) return;

        const result = await Swal.fire({
            title: "¿Imprimir comprobante?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#f59e0b",
            cancelButtonColor: "#78716c",
            confirmButtonText: "Sí, imprimir",
            cancelButtonText: "No",
            reverseButtons: true,
        });
        if (result.isConfirmed) print(orderId, returnId);
    };
};

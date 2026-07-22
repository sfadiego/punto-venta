import { useState } from "react";
import { toast } from "react-toastify";
import { usePrintAgent } from "@/hooks/usePrintAgent";

const ESC = 0x1b;
const GS = 0x1d;

function buildTestBytes(businessName: string): Uint8Array {
    const enc = new TextEncoder();
    const date = new Date().toLocaleString("es-MX");
    const line = "================================";

    const parts: Uint8Array[] = [
        new Uint8Array([ESC, 0x40]),              // Initialize
        new Uint8Array([ESC, 0x61, 0x01]),        // Center
        new Uint8Array([ESC, 0x21, 0x10]),        // Double height
        enc.encode("PRUEBA DE IMPRESION\n"),
        new Uint8Array([ESC, 0x21, 0x00]),        // Normal
        enc.encode(line + "\n"),
        new Uint8Array([ESC, 0x61, 0x00]),        // Left
        enc.encode("Negocio : " + businessName + "\n"),
        enc.encode("Fecha   : " + date + "\n"),
        enc.encode(line + "\n"),
        new Uint8Array([ESC, 0x61, 0x01]),        // Center
        enc.encode("Agente de impresion: OK\n"),
        enc.encode("Sistema POS\n"),
        new Uint8Array([ESC, 0x64, 0x04]),        // Feed 4 lines
        new Uint8Array([GS, 0x56, 0x41, 0x03]),  // Partial cut
    ];

    const total = parts.reduce((n, p) => n + p.length, 0);
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        bytes.set(p, offset);
        offset += p.length;
    }
    return bytes;
}

export const useTestPrint = (businessName?: string | null) => {
    const { print } = usePrintAgent();
    const [isPending, setIsPending] = useState(false);

    const testPrint = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            const bytes = buildTestBytes(businessName ?? "POS");
            await print(bytes);
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

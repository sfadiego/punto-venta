// UUIDs de los módulos "BLE serial" de referencia (HM-10, Microchip transparent
// UART, genéricos de impresora) que usa prácticamente toda impresora térmica BLE
// económica. 0000ff00 va primero porque es el confirmado con hardware real
// (POS-5890U-I, característica ff02) — ver diagnóstico en printer-agent.
// Si un modelo nuevo no aparece con ninguno de estos, hay que descubrir su UUID
// (con una herramienta de diagnóstico BLE) y agregarlo aquí.
export const BLE_PRINTER_CANDIDATE_SERVICES = [
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "000018f0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

// El MTU por defecto en BLE es pequeño (~20 bytes de payload); mandar un ticket
// completo de una sola vez lo trunca o lo pierde en la mayoría de estos módulos.
export const BLE_CHUNK_SIZE = 20;

export const chunkBytes = (bytes: Uint8Array, size = BLE_CHUNK_SIZE): Uint8Array[] => {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += size) {
        chunks.push(bytes.slice(i, i + size));
    }
    return chunks;
};

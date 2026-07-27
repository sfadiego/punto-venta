// Web Serial no está incluido en lib.dom.d.ts de TypeScript. Tipos mínimos
// para lo que usa ScaleContext (báscula Torrey L-PCR por USB) — no es la
// definición completa de la spec.
interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    parity?: "none" | "even" | "odd";
    stopBits?: 1 | 2;
}

interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    forget?(): Promise<void>;
}

interface SerialPortRequestOptions {
    filters?: { usbVendorId?: number; usbProductId?: number }[];
}

interface Serial extends EventTarget {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
    readonly serial?: Serial;
}

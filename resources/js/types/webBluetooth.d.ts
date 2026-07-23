// Web Bluetooth no está incluido en lib.dom.d.ts de TypeScript. Tipos mínimos
// para lo que usa BluetoothPrintContext — no es la definición completa de la spec.
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    readonly uuid: string;
    readonly service: BluetoothRemoteGATTService;
    readonly properties: {
        read: boolean;
        write: boolean;
        writeWithoutResponse: boolean;
        notify: boolean;
        indicate: boolean;
    };
    readonly value?: DataView;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    readValue(): Promise<DataView>;
}

interface BluetoothRemoteGATTService extends EventTarget {
    readonly uuid: string;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: string): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
    readonly connected: boolean;
    readonly device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: string): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
    readonly id: string;
    readonly name?: string;
    readonly gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothLEScanFilter {
    services?: string[];
    name?: string;
    namePrefix?: string;
}

interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: string[];
    acceptAllDevices?: boolean;
}

interface Bluetooth extends EventTarget {
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices?(): Promise<BluetoothDevice[]>;
}

interface Navigator {
    readonly bluetooth?: Bluetooth;
}

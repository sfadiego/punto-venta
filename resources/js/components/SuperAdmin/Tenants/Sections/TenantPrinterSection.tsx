import { Printer, Bluetooth } from "lucide-react";

interface TenantPrinterSectionProps {
    enabled: boolean;
    onToggle: () => void;
    bluetoothEnabled: boolean;
    onToggleBluetooth: () => void;
}

const ToggleRow = ({
    icon,
    title,
    description,
    enabled,
    onToggle,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
        </div>
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                enabled ? "bg-indigo-600" : "bg-slate-200"
            }`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    enabled ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    </div>
);

export const TenantPrinterSection = ({
    enabled,
    onToggle,
    bluetoothEnabled,
    onToggleBluetooth,
}: TenantPrinterSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <ToggleRow
            icon={<Printer size={17} className="text-slate-500" />}
            title="Agente de impresión"
            description="Habilita la conexión con el agente local (.exe) del cliente. Se activa automáticamente en desarrollo."
            enabled={enabled}
            onToggle={onToggle}
        />
        <div className="border-t border-slate-100" />
        <ToggleRow
            icon={<Bluetooth size={17} className="text-slate-500" />}
            title="Impresión por Bluetooth (tablets)"
            description="Permite emparejar e imprimir directo desde el navegador de una tablet, sin agente local. Requiere una impresora térmica BLE."
            enabled={bluetoothEnabled}
            onToggle={onToggleBluetooth}
        />
    </section>
);

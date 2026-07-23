import { IBusinessConfig } from "@/models/IBusinessConfig";
import { PrintAgentStatus } from "./PrintAgentStatus";
import { PrinterConfigForm } from "./PrinterConfigForm";
import { BluetoothPrinterSection } from "./BluetoothPrinterSection";

interface PrinterSectionProps {
    config: IBusinessConfig | undefined;
}

const isLocal = import.meta.env.VITE_APP_ENV === "local";

export const PrinterSection = ({ config }: PrinterSectionProps) => (
    <div className="flex flex-col gap-5">
        {isLocal ? <PrinterConfigForm config={config} /> : <PrintAgentStatus />}
        {config?.bluetooth_printing_enabled && <BluetoothPrinterSection />}
    </div>
);

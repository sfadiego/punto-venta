import { IBusinessConfig } from "@/models/IBusinessConfig";
import { PrintAgentStatus } from "./PrintAgentStatus";
import { PrinterConfigForm } from "./PrinterConfigForm";

interface PrinterSectionProps {
    config: IBusinessConfig | undefined;
}

const isLocal = import.meta.env.VITE_APP_ENV === "local";

export const PrinterSection = ({ config }: PrinterSectionProps) => {
    if (!isLocal) {
        return <PrintAgentStatus />;
    }

    return <PrinterConfigForm config={config} />;
};

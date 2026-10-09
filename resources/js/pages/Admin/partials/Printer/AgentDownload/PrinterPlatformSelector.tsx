import { Apple, Monitor } from "lucide-react";
import { PrinterAgentPlatform } from "@/services/usePrinterAgentService";

const PLATFORMS = [
    { value: "win", label: "Windows", Icon: Monitor },
    { value: "mac", label: "macOS", Icon: Apple },
] as const;

interface PrinterPlatformSelectorProps {
    value: PrinterAgentPlatform;
    onChange: (platform: PrinterAgentPlatform) => void;
}

export const PrinterPlatformSelector = ({ value, onChange }: PrinterPlatformSelectorProps) => (
    <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map(({ value: platform, label, Icon }) => (
            <button
                key={platform}
                type="button"
                onClick={() => onChange(platform)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors
                    ${value === platform
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"}`}
            >
                <Icon size={15} />
                {label}
            </button>
        ))}
    </div>
);

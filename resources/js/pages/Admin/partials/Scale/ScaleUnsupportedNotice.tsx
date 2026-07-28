import { AlertTriangle } from "lucide-react";

export const ScaleUnsupportedNotice = () => (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-amber-50 border-amber-100">
        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700">
            Este navegador no soporta báscula USB. Usa Chrome o Edge de escritorio.
        </p>
    </div>
);

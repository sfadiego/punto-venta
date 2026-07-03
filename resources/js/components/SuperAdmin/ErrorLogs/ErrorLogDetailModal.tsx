import { X, Globe, Monitor, Clock, Hash } from "lucide-react";
import { IErrorLog } from "@/models/IErrorLog";

const METHOD_COLORS: Record<string, string> = {
    GET:    "bg-sky-100 text-sky-700",
    POST:   "bg-emerald-100 text-emerald-700",
    PUT:    "bg-amber-100 text-amber-700",
    PATCH:  "bg-orange-100 text-orange-700",
    DELETE: "bg-red-100 text-red-700",
    CLIENT: "bg-purple-100 text-purple-700",
};

const SOURCE_COLORS: Record<string, string> = {
    frontend: "bg-indigo-100 text-indigo-700",
    backend:  "bg-slate-100 text-slate-700",
};

interface ErrorLogDetailModalProps {
    log: IErrorLog | null;
    onClose: () => void;
}

const JsonBlock = ({ label, data }: { label: string; data: unknown }) => {
    if (!data) return null;
    return (
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <pre className="bg-slate-950 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="text-sm text-slate-800">{children}</div>
    </div>
);

export const ErrorLogDetailModal = ({ log, onClose }: ErrorLogDetailModalProps) => {
    if (!log) return null;

    const statusColor = log.status_code >= 500
        ? "text-red-600 bg-red-50"
        : log.status_code >= 400
        ? "text-amber-600 bg-amber-50"
        : "text-slate-600 bg-slate-50";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${METHOD_COLORS[log.method] ?? "bg-slate-100 text-slate-500"}`}>
                            {log.method}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[log.source] ?? "bg-slate-100 text-slate-500"}`}>
                            {log.source}
                        </span>
                        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${statusColor}`}>
                            {log.status_code || "—"}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Endpoint">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono break-all">
                                {log.endpoint}
                            </code>
                        </Field>
                        <Field label="Fecha">
                            <span className="flex items-center gap-1.5 text-slate-600 text-xs">
                                <Clock size={13} />
                                {new Date(log.created_at).toLocaleString("es-MX", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                })}
                            </span>
                        </Field>
                    </div>

                    {/* Error message */}
                    <Field label="Mensaje de error">
                        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 font-mono break-all">
                            {log.error_message}
                        </p>
                    </Field>

                    {/* URL completa */}
                    {log.url && (
                        <Field label="URL completa">
                            <span className="flex items-start gap-1.5 text-slate-600 text-xs font-mono break-all">
                                <Globe size={13} className="mt-0.5 shrink-0" />
                                {log.url}
                            </span>
                        </Field>
                    )}

                    {/* User agent */}
                    {log.user_agent && (
                        <Field label="User Agent">
                            <span className="flex items-start gap-1.5 text-slate-500 text-xs break-all">
                                <Monitor size={13} className="mt-0.5 shrink-0" />
                                {log.user_agent}
                            </span>
                        </Field>
                    )}

                    {/* ID */}
                    <Field label="ID del registro">
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                            <Hash size={13} />
                            {log.id}
                        </span>
                    </Field>

                    {/* JSON blocks */}
                    <JsonBlock label="Request Payload" data={log.request_payload} />
                    <JsonBlock label="Response Body" data={log.response_body} />
                </div>
            </div>
        </div>
    );
};

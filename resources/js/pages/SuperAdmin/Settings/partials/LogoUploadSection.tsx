import { Upload } from "lucide-react";

interface LogoUploadSectionProps {
    enabled: boolean;
    saving: boolean;
    onToggle: () => void;
}

export const LogoUploadSection = ({ enabled, saving, onToggle }: LogoUploadSectionProps) => (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Logo</h2>
        <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Upload size={16} className="text-slate-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">Subida de imagen de logo</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Permite que los clientes suban su propio logo desde su panel de configuración.
                        Requiere almacenamiento persistente configurado.
                    </p>
                </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={saving}
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50
                    ${enabled ? "bg-indigo-600" : "bg-slate-200"}`}
            >
                <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform
                        ${enabled ? "translate-x-5" : "translate-x-0"}`}
                />
            </button>
        </div>
    </section>
);

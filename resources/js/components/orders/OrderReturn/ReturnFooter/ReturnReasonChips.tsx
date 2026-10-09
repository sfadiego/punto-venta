import { RETURN_REASON_LABELS, ReturnReasonEnum } from "@/enums/ReturnReasonEnum";

const REASON_OPTIONS = Object.entries(RETURN_REASON_LABELS) as [ReturnReasonEnum, string][];

interface ReturnReasonChipsProps {
    value: ReturnReasonEnum | "";
    onChange: (reason: ReturnReasonEnum) => void;
    error?: string;
}

// Motivo de la devolución como tres chips: un clic, sin abrir una lista, y deja más espacio a los productos.
export const ReturnReasonChips = ({ value, onChange, error }: ReturnReasonChipsProps) => (
    <div>
        <p className="mb-2 text-xs font-semibold text-stone-600">Motivo *</p>
        <div role="group" aria-label="Motivo de la devolución" className="flex flex-wrap gap-2">
            {REASON_OPTIONS.map(([reason, label]) => (
                <button
                    key={reason}
                    type="button"
                    aria-pressed={value === reason}
                    onClick={() => onChange(reason)}
                    className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                        value === reason
                            ? "border-amber-500 bg-amber-50 text-amber-800"
                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

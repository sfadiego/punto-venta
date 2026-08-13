import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { WeightUnit, weightMin, weightMax } from "@/utils/weightUnits";
import { Input } from "@/components/ui/form/Input";

interface TicketRowProps {
    name: string;
    quantityLabel: string;
    priceLabel: string;
    lineTotal: number;
    onRemove?: () => void;
    highlighted?: boolean;
    /** Solo para líneas por peso/volumen — habilita el lápiz de edición inline. */
    editableWeight?: { cantidad: number; unit: WeightUnit; onCommit: (weightKg: number) => void };
}

export const TicketRow = ({
    name,
    quantityLabel,
    priceLabel,
    lineTotal,
    onRemove,
    highlighted = false,
    editableWeight,
}: TicketRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState("");

    const startEdit = () => {
        if (!editableWeight) return;
        setDraft(String(editableWeight.cantidad));
        setIsEditing(true);
    };

    const cancelEdit = () => setIsEditing(false);

    const commitEdit = () => {
        if (!editableWeight) return;
        const value = parseFloat(draft);
        if (!isNaN(value) && value > 0) editableWeight.onCommit(value);
        setIsEditing(false);
    };

    return (
        <div
            className={`flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg border-b border-stone-100 last:border-b-0 transition-colors duration-500 ${
                highlighted ? "bg-amber-100" : "bg-transparent"
            }`}
        >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Quitar ${name}`}
                        className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-900 truncate">{name}</p>

                    {isEditing && editableWeight ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Input
                                name="peso"
                                inputType="number"
                                autoFocus
                                inputMode="decimal"
                                min={weightMin(editableWeight.unit)}
                                max={weightMax(editableWeight.unit)}
                                step={editableWeight.unit === UnidadMedidaEnum.Gr ? 1 : 0.01}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEdit();
                                    if (e.key === "Escape") cancelEdit();
                                }}
                                inputStyle="none"
                                containerClassName="w-20 shrink-0"
                                className="!w-20 !min-w-0 !px-1.5 !py-0.5 !text-xs font-semibold tabular-nums !border !border-amber-300 !rounded-lg focus:!ring-2 focus:!ring-amber-400"
                            />
                            <span className="text-xs text-stone-500 shrink-0">{UNIDAD_LABELS[editableWeight.unit]}</span>
                            <button
                                type="button"
                                onClick={commitEdit}
                                aria-label="Confirmar peso"
                                className="shrink-0 p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                aria-label="Cancelar edición"
                                className="shrink-0 p-1 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-stone-500 tabular-nums flex items-center gap-1">
                            <span className="truncate">
                                {quantityLabel} · {priceLabel}
                            </span>
                            {editableWeight && (
                                <button
                                    type="button"
                                    onClick={startEdit}
                                    aria-label={`Editar peso de ${name}`}
                                    className="shrink-0 p-0.5 rounded text-stone-300 hover:text-amber-600 transition-colors"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </p>
                    )}
                </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-stone-900 tabular-nums">{formatCurrencyTrimmed(lineTotal)}</span>
        </div>
    );
};

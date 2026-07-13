import { MessageSquare, Check, X } from "lucide-react";
import { useState } from "react";

interface CartItemNoteProps {
    observacion: string | null | undefined;
    onSave: (note: string) => void;
}

export const CartItemNote = ({ observacion, onSave }: CartItemNoteProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(observacion ?? "");

    const open = () => {
        setValue(observacion ?? "");
        setIsEditing(true);
    };

    const cancel = () => {
        setValue(observacion ?? "");
        setIsEditing(false);
    };

    const save = () => {
        onSave(value.trim());
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); save(); }
        if (e.key === "Escape") cancel();
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 mt-1">
                <input
                    autoFocus
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: sin cebolla, sin salsa..."
                    maxLength={200}
                    className="flex-1 text-xs px-2 py-1 border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-amber-50"
                />
                <button
                    onClick={save}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                    <Check size={11} />
                </button>
                <button
                    onClick={cancel}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
                >
                    <X size={11} />
                </button>
            </div>
        );
    }

    return (
        <button onClick={open} className="flex items-center gap-1 mt-0.5 group">
            {observacion ? (
                <p className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors">
                    <MessageSquare size={11} className="shrink-0" />
                    <span className="truncate max-w-[160px]">{observacion}</span>
                </p>
            ) : (
                <span className="flex items-center gap-1 text-xs text-stone-300 group-hover:text-stone-400 transition-colors">
                    <MessageSquare size={11} />
                    Agregar nota
                </span>
            )}
        </button>
    );
};

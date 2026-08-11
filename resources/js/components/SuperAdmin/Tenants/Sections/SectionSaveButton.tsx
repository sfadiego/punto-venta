import { Loader, Save } from "lucide-react";

interface SectionSaveButtonProps {
    onSave: () => void;
    isSaving: boolean;
}

export const SectionSaveButton = ({ onSave, isSaving }: SectionSaveButtonProps) => (
    <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
            {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
        </button>
    </div>
);

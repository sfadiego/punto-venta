import { Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";

interface NewCustomerInlineFormProps {
    newName: string;
    setNewName: (v: string) => void;
    newPhone: string;
    setNewPhone: (v: string) => void;
    isCreating: boolean;
    onCancel: () => void;
    onCreate: () => void;
}

export const NewCustomerInlineForm = ({
    newName, setNewName, newPhone, setNewPhone, isCreating, onCancel, onCreate,
}: NewCustomerInlineFormProps) => (
    <div className="space-y-2 border border-stone-100 rounded-xl p-3">
        <Input
            name="new_customer_name"
            inputType="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del cliente"
        />
        <Input
            name="new_customer_phone"
            inputType="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
        />
        <div className="flex gap-2">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50 transition-colors"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={onCreate}
                disabled={isCreating}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
                {isCreating && <Loader size={12} className="animate-spin" />}
                Crear y seleccionar
            </button>
        </div>
    </div>
);

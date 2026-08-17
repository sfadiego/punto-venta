import { Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { ICustomer } from "@/models/ICustomer";
import { sanitizePhoneInput } from "@/utils/phoneUtils";

interface NewCustomerInlineFormProps {
    newName: string;
    setNewName: (v: string) => void;
    newPhone: string;
    setNewPhone: (v: string) => void;
    isCreating: boolean;
    existingByPhone: ICustomer | null;
    phoneError: string | null;
    onCancel: () => void;
    onCreate: () => void;
}

export const NewCustomerInlineForm = ({
    newName, setNewName, newPhone, setNewPhone, isCreating, existingByPhone, phoneError, onCancel, onCreate,
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
            onChange={(e) => setNewPhone(sanitizePhoneInput(e.target.value))}
            placeholder="Teléfono (opcional)"
        />
        {phoneError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                {phoneError}
            </p>
        )}
        {existingByPhone && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                Ya existe un cliente con ese teléfono: <strong>{existingByPhone.name}</strong>. Se seleccionará automáticamente.
            </p>
        )}
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
                disabled={isCreating || !!phoneError}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
                {isCreating && <Loader size={12} className="animate-spin" />}
                {existingByPhone ? "Seleccionar cliente" : "Crear y seleccionar"}
            </button>
        </div>
    </div>
);

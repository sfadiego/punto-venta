import { X, Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { SelectBusinessNiche } from "@/components/SelectBusinessNiche";
import { IClientLeadCreatePayload } from "@/models/IClientLead";
import { useClientLeadCreateModal } from "./useClientLeadCreateModal";
import { SelectClientLeadStatus } from "./SelectClientLeadStatus";

interface ClientLeadCreateModalProps {
    isOpen: boolean;
    isSaving: boolean;
    onSave: (payload: IClientLeadCreatePayload) => Promise<void>;
    onClose: () => void;
}

export const ClientLeadCreateModal = ({ isOpen, isSaving, onSave, onClose }: ClientLeadCreateModalProps) => {
    const { formik } = useClientLeadCreateModal(onSave);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-slate-900">Nuevo cliente potencial</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <Input name="business_name" label="Negocio" placeholder="Nombre del negocio" formik={formik} />
                    <Input name="email" inputType="email" label="Email" placeholder="Correo electrónico" formik={formik} />
                    <Input name="phone" inputType="tel" label="Teléfono" placeholder="Teléfono" formik={formik} maxLength={12} />
                    <SelectBusinessNiche name="business_niche" formik={formik} label="Giro del negocio" />
                    <SelectClientLeadStatus name="status" formik={formik} />
                    <Textarea
                        name="notes"
                        label="Notas"
                        placeholder="Ej. Contacto por referencia de otro negocio..."
                        formik={formik}
                        rows={3}
                    />

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                        >
                            {isSaving && <Loader size={14} className="animate-spin" />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

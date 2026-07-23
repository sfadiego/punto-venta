import { X, Building2, Mail, Phone, Tag, Loader } from "lucide-react";
import { Select, SelectOption } from "@/components/ui/form/Select";
import { Textarea } from "@/components/ui/form/textarea";
import { IDemoRequest, IUpdateDemoRequestPayload } from "@/models/IDemoRequest";
import { BUSINESS_NICHE_LABELS } from "@/enums/BusinessNicheEnum";
import { DEMO_REQUEST_STATUS_LABELS } from "@/enums/DemoRequestStatusEnum";
import { useDemoRequestDetailModal } from "./useDemoRequestDetailModal";

const STATUS_OPTIONS: SelectOption[] = Object.entries(DEMO_REQUEST_STATUS_LABELS).map(
    ([value, label]) => ({ value, label }),
);

const Field = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 text-sm text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {children}
    </div>
);

interface DemoRequestDetailModalProps {
    demoRequest: IDemoRequest | null;
    isSaving: boolean;
    onSave: (payload: IUpdateDemoRequestPayload) => Promise<void>;
    onClose: () => void;
}

export const DemoRequestDetailModal = ({
    demoRequest,
    isSaving,
    onSave,
    onClose,
}: DemoRequestDetailModalProps) => {
    const { formik } = useDemoRequestDetailModal(demoRequest, onSave);

    if (!demoRequest) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-slate-900">Solicitud de demo</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div className="space-y-2.5">
                        <Field icon={<Building2 size={15} />}>{demoRequest.business_name}</Field>
                        <Field icon={<Mail size={15} />}>{demoRequest.email}</Field>
                        <Field icon={<Phone size={15} />}>{demoRequest.phone}</Field>
                        <Field icon={<Tag size={15} />}>
                            {BUSINESS_NICHE_LABELS[demoRequest.business_niche] ?? demoRequest.business_niche}
                        </Field>
                    </div>

                    <Select
                        name="status"
                        label="Estatus"
                        options={STATUS_OPTIONS}
                        formik={formik}
                    />

                    <Textarea
                        name="notes"
                        label="Notas de seguimiento"
                        placeholder="Ej. Se contactó por WhatsApp, pendiente de respuesta..."
                        formik={formik}
                        rows={4}
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

import { Loader, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { IAddon } from "@/models/IAddon";
import { AddonForm, useAddonDetailModal } from "./useAddonDetailModal";

interface AddonDetailModalProps {
    isOpen: boolean;
    /** null = crear un topping nuevo. */
    addon: IAddon | null;
    onSaved: (addon: IAddon) => void;
    onClose: () => void;
}

export const AddonDetailModal = ({ isOpen, addon, onSaved, onClose }: AddonDetailModalProps) => {
    const { isEdit, formik, handleClose } = useAddonDetailModal(addon, onSaved, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Tag size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">{isEdit ? "Editar topping" : "Nuevo topping"}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Cerrar"
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="p-5 space-y-4">
                    <Input<AddonForm>
                        name="name"
                        label="Nombre *"
                        placeholder="Ej: Nieve de vainilla"
                        formik={formik}
                        maxLength={255}
                        autoFocus
                    />

                    <Input<AddonForm>
                        name="price"
                        label="Precio"
                        inputType="number"
                        min={0}
                        max={99999}
                        step={0.5}
                        icon="$"
                        placeholder="0.00"
                        formik={formik}
                    />
                    <p className="text-xs text-stone-400 -mt-2">Con precio 0 el topping se agrega sin costo.</p>

                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50">
                        <span className="text-sm text-stone-600 flex-1">Disponible al tomar pedidos</span>
                        <ToggleSwitch
                            checked={formik.values.is_active}
                            onChange={(value) => formik.setFieldValue("is_active", value)}
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {formik.isSubmitting ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : isEdit ? (
                                "Guardar cambios"
                            ) : (
                                "Crear topping"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

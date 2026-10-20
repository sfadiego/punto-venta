import { Loader, X } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { CatalogFormatSelector } from "./CatalogFormatSelector";
import { useExportCatalogModal } from "./useExportCatalogModal";

interface ExportCatalogModalProps {
    onClose: () => void;
}

/** Modal de "Descargar catálogo": elige el formato (CSV o PDF) y, solo en PDF, si incluye el código de barras. */
export const ExportCatalogModal = ({ onClose }: ExportCatalogModalProps) => {
    const { formik, isPdf } = useExportCatalogModal(onClose);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <div>
                        <h2 className="text-base font-semibold text-stone-900">Descargar catálogo</h2>
                        <p className="text-xs text-stone-400">Todos los productos, activos e inactivos</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="p-5 space-y-4">
                    <CatalogFormatSelector
                        value={formik.values.format}
                        onChange={(format) => formik.setFieldValue("format", format)}
                    />
                    {formik.errors.format && <p className="text-xs text-red-500">{formik.errors.format}</p>}

                    {isPdf && (
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
                            <div>
                                <p className="text-sm font-medium text-stone-700">Incluir código de barras</p>
                                <p className="text-xs text-stone-400">
                                    {formik.values.include_barcode
                                        ? "Cada producto lleva su código de barras"
                                        : "Lista simple, con el código como texto"}
                                </p>
                            </div>
                            <ToggleSwitch
                                checked={formik.values.include_barcode}
                                onChange={(checked) => formik.setFieldValue("include_barcode", checked)}
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {formik.isSubmitting && <Loader size={15} className="animate-spin" />}
                            {formik.isSubmitting ? "Descargando..." : "Descargar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

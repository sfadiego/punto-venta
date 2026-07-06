import { Printer, Network, Loader, Info } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { usePrinterSection } from "./usePrinterSection";

interface PrinterSectionProps {
    config: IBusinessConfig | undefined;
}

export const PrinterSection = ({ config }: PrinterSectionProps) => {
    const { formik } = usePrinterSection(config);

    return (
        <form onSubmit={formik.handleSubmit} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Configuración de impresora</h2>
                <p className="text-xs text-stone-400">Impresora térmica para tickets de venta</p>
            </div>

            {/* Nombre de impresora — usado por el printer-agent */}
            <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1.5">
                    <span className="text-amber-500"><Printer size={15} /></span>
                    Nombre de impresora
                </label>
                <input
                    type="text"
                    name="printer_name"
                    value={formik.values.printer_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="EPSON_TM-T20"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                {formik.touched.printer_name && formik.errors.printer_name && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.printer_name}</p>
                )}
                <div className="mt-2 flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Requiere el{" "}
                        <span className="font-semibold">printer-agent</span>{" "}
                        corriendo en la máquina del cliente. El nombre debe coincidir exactamente con el configurado en el agente.
                    </p>
                </div>
            </div>

            {/* IP de impresora — solo para instalaciones locales con acceso de red directo */}
            <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1.5">
                    <span className="text-stone-400"><Network size={15} /></span>
                    IP de impresora
                    <span className="ml-1 text-stone-400 font-normal">(solo instalación local)</span>
                </label>
                <input
                    type="text"
                    name="printer_host"
                    value={formik.values.printer_host}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="192.168.1.100"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-500"
                />
                {formik.touched.printer_host && formik.errors.printer_host && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.printer_host}</p>
                )}
                <p className="text-xs text-stone-400 mt-1">
                    Usado cuando el servidor tiene acceso directo a la impresora por red local. No aplica en producción en la nube.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={formik.isSubmitting || !formik.dirty}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                    {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                    Guardar impresora
                </button>
            </div>
        </form>
    );
};

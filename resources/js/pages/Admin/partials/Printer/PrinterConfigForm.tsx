import { Loader, Info } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { Input } from "@/components/ui/form/Input";
import { usePrinterSection } from "./usePrinterSection";

interface PrinterConfigFormProps {
    config: IBusinessConfig | undefined;
}

type PrinterFormValues = { printer_name: string; printer_host: string };

export const PrinterConfigForm = ({ config }: PrinterConfigFormProps) => {
    const { formik } = usePrinterSection(config);

    return (
        <form onSubmit={formik.handleSubmit} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Configuración de impresora</h2>
                <p className="text-xs text-stone-400">Impresora térmica para tickets de venta (solo desarrollo local)</p>
            </div>

            <div className="space-y-1">
                <Input<PrinterFormValues>
                    name="printer_name"
                    label="Nombre de impresora"
                    placeholder="EPSON_TM-T20"
                    maxLength={100}
                    formik={formik}
                />
                <div className="flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Requiere el{" "}
                        <span className="font-semibold">printer-agent</span>{" "}
                        corriendo en esta máquina. El nombre debe coincidir con el configurado en el agente.
                    </p>
                </div>
            </div>

            <div className="space-y-1">
                <Input<PrinterFormValues>
                    name="printer_host"
                    label="IP de impresora"
                    placeholder="192.168.1.100"
                    maxLength={100}
                    formik={formik}
                />
                <p className="text-xs text-stone-400">
                    Usado cuando el servidor tiene acceso directo a la impresora por red local.
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

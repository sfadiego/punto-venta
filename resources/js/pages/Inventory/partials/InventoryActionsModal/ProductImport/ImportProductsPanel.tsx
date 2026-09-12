import { RefObject } from "react";
import { Upload, Download, FileText, RotateCcw } from "lucide-react";
import { IProductImportReport } from "@/services/useProductImportService";
import { trimDecimalZeros } from "@/utils/formatDecimal";

interface ImportProductsPanelProps {
    inputRef: RefObject<HTMLInputElement | null>;
    file: File | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    openFilePicker: () => void;
    report: IProductImportReport | null;
    isPreviewing: boolean;
    isCommitting: boolean;
    runPreview: () => void;
    confirmImport: () => void;
    handleDownloadTemplate: () => void;
    reset: () => void;
}

export const ImportProductsPanel = ({
    inputRef,
    file,
    handleFileChange,
    openFilePicker,
    report,
    isPreviewing,
    isCommitting,
    runPreview,
    confirmImport,
    handleDownloadTemplate,
    reset,
}: ImportProductsPanelProps) => (
    <div className="space-y-4">
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

        <button
            type="button"
            onClick={openFilePicker}
            className="w-full flex flex-col items-center gap-1.5 border-2 border-dashed border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 rounded-xl px-4 py-5 text-center transition-colors"
        >
            {file ? (
                <>
                    <FileText size={22} className="text-amber-500" />
                    <span className="text-sm font-medium text-stone-800">{file.name}</span>
                    <span className="text-xs text-stone-400">Toca para elegir otro archivo</span>
                </>
            ) : (
                <>
                    <Upload size={22} className="text-stone-400" />
                    <span className="text-sm font-medium text-stone-700">Elegir archivo CSV</span>
                    <span className="text-xs text-stone-400">Productos nuevos o actualización por código</span>
                </>
            )}
        </button>

        <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
        >
            <Download size={13} />
            Descargar plantilla
        </button>

        {report && (
            <div className="space-y-2.5">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 px-1">
                    <span><strong className="text-emerald-600">{report.summary.to_create}</strong> por crear</span>
                    <span><strong className="text-blue-600">{report.summary.to_update}</strong> por actualizar</span>
                    <span><strong className="text-amber-600">{report.summary.warnings}</strong> revisar</span>
                    <span><strong className="text-red-600">{report.summary.errors}</strong> con error</span>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-stone-100">
                    {report.rows.map((row) => (
                        <div key={row.row} className="flex items-start gap-2 px-3 py-2 text-xs">
                            <span
                                className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${row.action === "error"
                                        ? "bg-red-100 text-red-700"
                                        : row.warnings.length > 0
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-emerald-100 text-emerald-700"
                                    }`}
                            >
                                {row.action === "error" ? "ERROR" : row.action === "update" ? "ACTUALIZAR" : "CREAR"}
                            </span>
                            <span className="text-stone-600">
                                Fila {row.row}
                                {row.data && "nombre" in row.data && <> · <strong className="text-stone-800">{row.data.nombre}</strong></>}
                                {row.data && "manage_stock" in row.data && row.data.manage_stock && row.data.stock !== null && (
                                    <span className="block text-stone-500">
                                        Stock a actualizar: <strong className="text-stone-700">{trimDecimalZeros(row.data.stock)}</strong>
                                    </span>
                                )}
                                {[...row.errors, ...row.warnings].map((msg) => (
                                    <span key={msg} className="block text-stone-500">{msg}</span>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="pt-1">
            {!report ? (
                <button
                    type="button"
                    onClick={runPreview}
                    disabled={!file || isPreviewing}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPreviewing ? "Analizando..." : "Importar"}
                </button>
            ) : (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={reset}
                        disabled={isCommitting}
                        title="Reiniciar y subir un archivo corregido"
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RotateCcw size={14} />
                        Reiniciar
                    </button>
                    <button
                        type="button"
                        onClick={confirmImport}
                        disabled={isCommitting}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCommitting ? "Importando..." : "Confirmar importación"}
                    </button>
                </div>
            )}
        </div>
    </div>
);

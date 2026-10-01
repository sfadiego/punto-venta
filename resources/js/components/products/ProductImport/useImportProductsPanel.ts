import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import {
    useImportProductsPreview,
    useImportProductsCommit,
    useDownloadImportTemplate,
    IProductImportReport,
} from "@/services/useProductImportService";
import { downloadBlob } from "@/utils/downloadFile";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

// Filas por request de commit — un archivo de miles de productos en una sola request/
// transacción excedía el timeout del load balancer en producción (cada fila crea/actualiza
// un producto y, si maneja stock, un movimiento auditado con lockForUpdate()). El backend
// reprocesa el archivo completo en cada chunk pero solo aplica su rango — ver doc en
// ProductImportService::commit().
const IMPORT_CHUNK_SIZE = 200;

export interface ImportCommitProgress {
    processed: number;
    total: number;
}

export interface ImportCompletedSummary {
    to_create: number;
    to_update: number;
    warnings: number;
}

// Pestaña "Importar" del modal de acciones de Inventario — flujo de dos pasos: el usuario
// elige un CSV, corre la vista previa (no escribe nada) y revisa el reporte fila por fila
// antes de confirmar. Sin isOpen/openModal/closeModal propios — el modal que lo contiene
// decide qué pestaña se muestra. Al terminar un commit exitoso, el panel se limpia solo
// (misma lógica que "Reiniciar") y queda listo para cargar otro CSV sin cerrar el modal —
// importar 3000 productos en un negocio con catálogo grande normalmente implica varios
// archivos seguidos, no solo uno.
export const useImportProductsPanel = () => {
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [report, setReport] = useState<IProductImportReport | null>(null);
    const [commitProgress, setCommitProgress] = useState<ImportCommitProgress | null>(null);
    const [completedSummary, setCompletedSummary] = useState<ImportCompletedSummary | null>(null);

    const { mutateAsync: previewMutate, isPending: isPreviewing } = useImportProductsPreview();
    const { mutateAsync: commitMutate } = useImportProductsCommit();
    const downloadTemplate = useDownloadImportTemplate();

    // El backend importa las filas válidas y omite en silencio las que tengan error (no
    // rechaza el lote completo) — sin este check, confirmar con filas en error las descarta
    // sin que el usuario lo note, ya que el commit igual responde éxito para el resto.
    const hasErrors = (report?.summary.errors ?? 0) > 0;
    // Abarca TODA la importación (todos los chunks), no solo el request en vuelo — a
    // diferencia de isPending de la mutación, que se resetea entre cada chunk.
    const isCommitting = commitProgress !== null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
        setReport(null);
        // Elegir un archivo nuevo = arrancar otra importación — el mensaje de la anterior ya
        // no aplica.
        setCompletedSummary(null);
    };

    const openFilePicker = () => inputRef.current?.click();

    const runPreview = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await previewMutate(formData);
            setReport((res as { data: { data: IProductImportReport } }).data.data);
        } catch (error) {
            logUnexpectedError(error, "useImportProductsPanel.runPreview");
            toast.error(getUserFacingErrorMessage(error, "Error al leer el archivo"));
        }
    };

    const invalidateAfterImport = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
        // La importación puede crear categorías nuevas (ver "categoria_status": "new" en
        // el reporte). useIndexCategories/useCategoryList cachean con nameQuery
        // "category/all" y "category/list" — distintos de la key base [ApiRoutes.Category]
        // (que solo cubre la tabla paginada) — sin invalidarlos también, el selector de
        // categoría del formulario de producto y las pills de categoría no verían las
        // nuevas hasta que expire el staleTime (Infinity en el caso de useCategoryList).
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Category] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Category}/all`] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Category}/list`] });
    };

    const confirmImport = async () => {
        if (!file || !report) return;

        const total = report.summary.total;
        setCommitProgress({ processed: 0, total });
        // Cada chunk solo reporta el resumen de SU rango — se acumulan para mostrar el total
        // real de la importación completa en el mensaje final, no solo el del último chunk.
        const totals: ImportCompletedSummary = { to_create: 0, to_update: 0, warnings: 0 };

        try {
            for (let offset = 0; offset < total; offset += IMPORT_CHUNK_SIZE) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("offset", String(offset));
                formData.append("limit", String(IMPORT_CHUNK_SIZE));

                const res = await commitMutate(formData);
                const chunkReport = (res as { data: { data: IProductImportReport } }).data.data;
                totals.to_create += chunkReport.summary.to_create;
                totals.to_update += chunkReport.summary.to_update;
                totals.warnings += chunkReport.summary.warnings;

                setCommitProgress({ processed: Math.min(offset + IMPORT_CHUNK_SIZE, total), total });
            }

            invalidateAfterImport();
            toast.success("Importación de productos completada correctamente");
            // Limpia el formulario (mismo efecto que "Reiniciar") y deja el mensaje de éxito
            // visible — el modal se queda abierto, listo para cargar el siguiente archivo.
            resetState();
            setCompletedSummary(totals);
        } catch (error) {
            // Los chunks ya aplicados antes del error quedaron guardados — no hay rollback
            // entre chunks (cada uno es su propia transacción). Refrescar igual para que la
            // UI refleje lo que sí se alcanzó a importar.
            invalidateAfterImport();
            logUnexpectedError(error, "useImportProductsPanel.confirmImport");
            toast.error(
                getUserFacingErrorMessage(
                    error,
                    "Error al importar el archivo. Los productos ya procesados antes del error quedaron guardados.",
                ),
            );
        } finally {
            setCommitProgress(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadTemplate();
            downloadBlob(blob, "plantilla-productos.csv");
        } catch (error) {
            logUnexpectedError(error, "useImportProductsPanel.handleDownloadTemplate");
            toast.error("Error al descargar la plantilla");
        }
    };

    const resetState = () => {
        setFile(null);
        setReport(null);
        setCompletedSummary(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return {
        inputRef,
        file,
        handleFileChange,
        openFilePicker,
        report,
        hasErrors,
        isPreviewing,
        isCommitting,
        commitProgress,
        completedSummary,
        runPreview,
        confirmImport,
        handleDownloadTemplate,
        reset: resetState,
    };
};

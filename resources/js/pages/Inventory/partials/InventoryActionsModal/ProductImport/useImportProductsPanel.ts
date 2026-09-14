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

// Pestaña "Importar" del modal de acciones de Inventario — flujo de dos pasos: el usuario
// elige un CSV, corre la vista previa (no escribe nada) y revisa el reporte fila por fila
// antes de confirmar. Sin isOpen/openModal/closeModal propios — el modal que lo contiene
// decide qué pestaña se muestra. `onImported` cierra el modal contenedor una vez que el
// commit termina (éxito o error de negocio, ej. filas con error) — el usuario ya vio el
// reporte en pantalla antes de confirmar, no necesita revisarlo de nuevo tras aplicarlo.
export const useImportProductsPanel = (onImported?: () => void) => {
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [report, setReport] = useState<IProductImportReport | null>(null);

    const { mutateAsync: previewMutate, isPending: isPreviewing } = useImportProductsPreview();
    const { mutateAsync: commitMutate, isPending: isCommitting } = useImportProductsCommit();
    const downloadTemplate = useDownloadImportTemplate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
        setReport(null);
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

    const confirmImport = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await commitMutate(formData);
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
            toast.success("Importación de productos completada correctamente");
            resetState();
            onImported?.();
        } catch (error) {
            logUnexpectedError(error, "useImportProductsPanel.confirmImport");
            toast.error(getUserFacingErrorMessage(error, "Error al importar el archivo"));
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
        if (inputRef.current) inputRef.current.value = "";
    };

    return {
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
        reset: resetState,
    };
};

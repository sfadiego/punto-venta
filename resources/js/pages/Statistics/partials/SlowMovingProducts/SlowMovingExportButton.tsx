import { ExportCsvButton } from "@/components/ExportCsvButton";
import { useCsvDownload } from "@/hooks/useCsvDownload";
import { ISlowMovingFilters } from "@/models/ISlowMovingProduct";
import { useExportSlowMoving } from "@/services/useSlowMovingProductsService";

interface SlowMovingExportButtonProps {
    filters: ISlowMovingFilters;
}

// Descarga el listado completo (sin paginar) con los filtros activos de días, búsqueda y categoría.
export const SlowMovingExportButton = ({ filters }: SlowMovingExportButtonProps) => {
    const exportSlowMoving = useExportSlowMoving();
    const { isDownloading, handleDownload } = useCsvDownload({
        fetchFile: () => exportSlowMoving(filters),
        fileName: "productos-sin-movimiento",
        errorMessage: "Error al descargar el reporte de productos sin movimiento",
    });

    return <ExportCsvButton isDownloading={isDownloading} onClick={handleDownload} title="Descargar el listado filtrado (CSV)" />;
};

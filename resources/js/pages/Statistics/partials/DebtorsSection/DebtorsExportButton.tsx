import { ExportCsvButton } from "@/components/ExportCsvButton";
import { useCsvDownload } from "@/hooks/useCsvDownload";
import { useExportTopDebtors } from "@/services/useTopDebtorsService";

// Descarga toda la cartera de clientes con adeudo (no solo los 10 que muestra la sección).
export const DebtorsExportButton = () => {
    const exportDebtors = useExportTopDebtors();
    const { isDownloading, handleDownload } = useCsvDownload({
        fetchFile: exportDebtors,
        fileName: "clientes-con-adeudo",
        errorMessage: "Error al descargar el reporte de adeudos",
    });

    return <ExportCsvButton isDownloading={isDownloading} onClick={handleDownload} title="Descargar todos los clientes con adeudo (CSV)" />;
};

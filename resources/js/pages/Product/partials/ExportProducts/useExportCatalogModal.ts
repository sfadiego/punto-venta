import { useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { CatalogExportFormatEnum } from "@/enums/CatalogExportFormatEnum";
import { useExportProductBarcodeCatalog, useExportProductCatalog } from "@/services/useProductService";
import { downloadBlob } from "@/utils/downloadFile";
import { getCatalogFilename } from "@/utils/catalogExport";
import { getBlobErrorMessage } from "@/utils/blobErrorMessage";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export type ExportCatalogForm = {
    format: CatalogExportFormatEnum;
    include_barcode: boolean;
};

const schema = Yup.object({
    format: Yup.mixed<CatalogExportFormatEnum>()
        .oneOf(Object.values(CatalogExportFormatEnum), "Elige un formato")
        .required("Elige un formato"),
    include_barcode: Yup.boolean().required(),
});

export const useExportCatalogModal = (onClose: () => void) => {
    const exportCsv = useExportProductCatalog();
    const exportPdf = useExportProductBarcodeCatalog();
    // Guard síncrono contra doble clic: isSubmitting tarda un render en deshabilitar el botón.
    const inFlightRef = useRef(false);

    const formik = useFormik<ExportCatalogForm>({
        initialValues: { format: CatalogExportFormatEnum.Csv, include_barcode: true },
        validationSchema: schema,
        onSubmit: async ({ format, include_barcode }) => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            try {
                const isPdf = format === CatalogExportFormatEnum.Pdf;
                const blob = isPdf ? await exportPdf(include_barcode) : await exportCsv();
                downloadBlob(blob, getCatalogFilename(format, include_barcode));
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useExportCatalogModal.onSubmit");
                toast.error(await getBlobErrorMessage(error));
            } finally {
                inFlightRef.current = false;
            }
        },
    });

    const isPdf = formik.values.format === CatalogExportFormatEnum.Pdf;

    return { formik, isPdf };
};

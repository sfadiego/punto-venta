import { useRef } from "react";
import { toast } from "react-toastify";
import { useUploadLogo, useRemoveLogo } from "@/services/useBusinessConfigService";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IBusinessConfig } from "@/models/IBusinessConfig";

export const useLogoSection = (config: IBusinessConfig | undefined) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { mutate: upload, isPending: uploading } = useUploadLogo();
    const { mutate: remove, isPending: removing } = useRemoveLogo();

    const logoUrl = config?.logo_path
        ? `${ApiRoutes.Files}/${config.logo_path}`
        : null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append("logo", file);
        upload(form, {
            onSuccess: () => toast.success("Logo actualizado"),
            onError: () => toast.error("Error al subir el logo"),
        });
        e.target.value = "";
    };

    const handleRemove = () => {
        remove(undefined, {
            onSuccess: () => toast.success("Logo eliminado"),
            onError: () => toast.error("Error al eliminar el logo"),
        });
    };

    return { inputRef, logoUrl, uploading, removing, handleFileChange, handleRemove };
};

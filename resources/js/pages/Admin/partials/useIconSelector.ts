import { toast } from "react-toastify";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";
import { IBusinessConfig } from "@/models/IBusinessConfig";

export const useIconSelector = (config: IBusinessConfig | undefined) => {
    const { mutate: update, isPending: saving } = useUpdateBusinessConfig();

    const handleSelect = (iconName: string) => {
        if (!config) return;

        const isDeselect = config.logo_icon === iconName;

        update(
            {
                business_name: config.business_name,
                primary_color: config.primary_color,
                sidebar_color: config.sidebar_color,
                font_color: config.font_color,
                label_color: config.label_color,
                phone: config.phone,
                address: config.address,
                facebook: config.facebook,
                instagram: config.instagram,
                whatsapp: config.whatsapp,
                website: config.website,
                ticket_footer: config.ticket_footer,
                printer_name:              config.printer_name,
                printer_host:              config.printer_host,
                logo_icon:                 isDeselect ? null : iconName,
                costo_domicilio_default:   config.costo_domicilio_default,
            },
            {
                onSuccess: () =>
                    toast.success(isDeselect ? "Icono eliminado" : "Icono actualizado"),
                onError: () => toast.error("Error al guardar el icono"),
            }
        );
    };

    return { handleSelect, saving };
};

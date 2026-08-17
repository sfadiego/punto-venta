import { toast } from "react-toastify";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { IconSourceEnum } from "@/enums/IconSourceEnum";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useIconSelector = (config: IBusinessConfig | undefined) => {
    const { mutate: update, isPending: saving } = useUpdateBusinessConfig();

    const handleSelect = (iconName: string, iconSource: IconSourceEnum) => {
        if (!config) return;

        const isDeselect = iconName === "";

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
                paper_width:               config.paper_width,
                logo_icon:                 isDeselect ? null : iconName,
                logo_icon_source:          isDeselect ? null : iconSource,
                costo_domicilio_default:   config.costo_domicilio_default,
                printer_enabled:           config.printer_enabled,
                menu_enabled:              config.menu_enabled,
                purchases_enabled:              config.purchases_enabled,
                employees_enabled:              config.employees_enabled,
                stock_enabled:                  config.stock_enabled,
                customers_enabled:              config.customers_enabled,
            },
            {
                onSuccess: () =>
                    toast.success(isDeselect ? "Icono eliminado" : "Icono actualizado"),
                onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al guardar el icono")),
            }
        );
    };

    return { handleSelect, saving };
};

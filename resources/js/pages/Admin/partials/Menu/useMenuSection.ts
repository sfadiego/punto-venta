import { useState } from "react";
import { toast } from "react-toastify";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useMenuSection = (config: IBusinessConfig | undefined) => {
    const updateMutation = useUpdateBusinessConfig();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggle = async () => {
        if (!config || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await updateMutation.mutateAsync({
                business_name:           config.business_name,
                primary_color:           config.primary_color,
                sidebar_color:           config.sidebar_color,
                font_color:              config.font_color,
                label_color:             config.label_color,
                phone:                   config.phone,
                address:                 config.address,
                facebook:                config.facebook,
                instagram:               config.instagram,
                whatsapp:                config.whatsapp,
                website:                 config.website,
                ticket_footer:           config.ticket_footer,
                logo_icon:               config.logo_icon,
                logo_icon_source:        config.logo_icon_source,
                printer_name:            config.printer_name,
                printer_host:            config.printer_host,
                paper_width:             config.paper_width,
                printer_enabled:         config.printer_enabled,
                costo_domicilio_default: config.costo_domicilio_default,
                menu_enabled:            !config.menu_enabled,
                purchases_enabled:       config.purchases_enabled,
                employees_enabled:       config.employees_enabled,
                stock_enabled:           config.stock_enabled,
            });
            toast.success(
                !config.menu_enabled
                    ? "Pedidos en línea activados."
                    : "Pedidos en línea desactivados.",
            );
        } catch (error) {
            logUnexpectedError(error, "useMenuSection.toggle");
            toast.error(getUserFacingErrorMessage(error, "No se pudo guardar la configuración."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return { toggle, isSubmitting };
};

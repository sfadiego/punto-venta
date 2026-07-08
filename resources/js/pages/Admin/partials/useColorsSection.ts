import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";
import { IBusinessConfig } from "@/models/IBusinessConfig";

const DEFAULTS = {
    primary_color: "#F59E0B",
    sidebar_color: "#1C1917",
    font_color:    "#FFFFFF",
    label_color:   "#1C1917",
};

export const useColorsSection = (config: IBusinessConfig | undefined) => {
    const { mutate: update, isPending: saving } = useUpdateBusinessConfig();

    const [businessName, setBusinessName] = useState("");
    const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primary_color);
    const [sidebarColor, setSidebarColor] = useState(DEFAULTS.sidebar_color);
    const [fontColor, setFontColor] = useState(DEFAULTS.font_color);
    const [labelColor, setLabelColor] = useState(DEFAULTS.label_color);

    useEffect(() => {
        if (!config) return;
        setBusinessName(config.business_name);
        setPrimaryColor(config.primary_color);
        setSidebarColor(config.sidebar_color);
        setFontColor(config.font_color);
        setLabelColor(config.label_color);
    }, [config]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--color-primary", primaryColor);
        root.style.setProperty("--color-sidebar", sidebarColor);
        root.style.setProperty("--color-font", fontColor);
        root.style.setProperty("--color-label", labelColor);
    }, [primaryColor, sidebarColor, fontColor, labelColor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        update(
            {
                business_name: businessName,
                primary_color: primaryColor,
                sidebar_color: sidebarColor,
                font_color: fontColor,
                label_color: labelColor,
                phone:         config?.phone         ?? null,
                address:       config?.address       ?? null,
                facebook:      config?.facebook      ?? null,
                instagram:     config?.instagram     ?? null,
                whatsapp:      config?.whatsapp      ?? null,
                website:       config?.website       ?? null,
                ticket_footer: config?.ticket_footer ?? null,
                printer_name:              config?.printer_name  ?? null,
                printer_host:              config?.printer_host  ?? null,
                logo_icon:                 config?.logo_icon     ?? null,
                costo_domicilio_default:   config?.costo_domicilio_default ?? 0,
            },
            {
                onSuccess: () => toast.success("Configuración guardada"),
                onError: () => toast.error("Error al guardar"),
            },
        );
    };

    const handleReset = () => {
        setPrimaryColor(DEFAULTS.primary_color);
        setSidebarColor(DEFAULTS.sidebar_color);
        setFontColor(DEFAULTS.font_color);
        setLabelColor(DEFAULTS.label_color);

        update(
            {
                business_name: businessName,
                primary_color: DEFAULTS.primary_color,
                sidebar_color: DEFAULTS.sidebar_color,
                font_color:    DEFAULTS.font_color,
                label_color:   DEFAULTS.label_color,
                phone:         config?.phone         ?? null,
                address:       config?.address       ?? null,
                facebook:      config?.facebook      ?? null,
                instagram:     config?.instagram     ?? null,
                whatsapp:      config?.whatsapp      ?? null,
                website:       config?.website       ?? null,
                ticket_footer: config?.ticket_footer ?? null,
                printer_name:              config?.printer_name  ?? null,
                printer_host:              config?.printer_host  ?? null,
                logo_icon:                 config?.logo_icon     ?? null,
                costo_domicilio_default:   config?.costo_domicilio_default ?? 0,
            },
            {
                onSuccess: () => toast.success("Colores restablecidos"),
                onError:   () => toast.error("Error al restablecer"),
            },
        );
    };

    return {
        businessName, setBusinessName,
        primaryColor, setPrimaryColor,
        sidebarColor, setSidebarColor,
        fontColor, setFontColor,
        labelColor, setLabelColor,
        saving,
        handleSubmit,
        handleReset,
    };
};

import { IBusinessConfig } from "@/models/IBusinessConfig";

export type BusinessConfigPayload = Omit<
    IBusinessConfig,
    "id" | "slug" | "logo_path" | "logo_upload_enabled" | "bluetooth_printing_enabled" | "created_at" | "updated_at"
>;

// PUT /admin/config exige el formulario completo (nombre, colores, impresora...) — una sección que
// solo edita unos campos arma el payload con los valores actuales más sus cambios.
export const buildBusinessConfigPayload = (
    config: IBusinessConfig,
    overrides: Partial<BusinessConfigPayload> = {},
): BusinessConfigPayload => ({
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
    logo_icon: config.logo_icon,
    logo_icon_source: config.logo_icon_source,
    printer_name: config.printer_name,
    printer_host: config.printer_host,
    paper_width: config.paper_width,
    costo_domicilio_default: config.costo_domicilio_default,
    printer_enabled: config.printer_enabled,
    menu_enabled: config.menu_enabled,
    purchases_enabled: config.purchases_enabled,
    employees_enabled: config.employees_enabled,
    stock_enabled: config.stock_enabled,
    customers_enabled: config.customers_enabled,
    ...overrides,
});

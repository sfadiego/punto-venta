export interface IBusinessConfig {
    id: number;
    slug: string;
    business_name: string;
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
    logo_path: string | null;
    phone: string | null;
    address: string | null;
    facebook: string | null;
    instagram: string | null;
    whatsapp: string | null;
    website: string | null;
    ticket_footer: string | null;
    printer_name: string | null;
    printer_host: string | null;
    costo_domicilio_default: number;
    logo_icon: string | null;
    logo_upload_enabled: boolean;
    created_at: string;
    updated_at: string;
}

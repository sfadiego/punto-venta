const ADMIN_EMAIL_PREFIX = "admin";

// Correo sugerido del administrador de un cliente nuevo: admin@<slug>.com
export const buildAdminEmail = (slug: string): string => {
    const clean = slug.trim();
    return clean ? `${ADMIN_EMAIL_PREFIX}@${clean}.com` : "";
};

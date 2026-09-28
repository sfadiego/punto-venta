/** Arma el link de WhatsApp para enviar el comprobante de pago de una suscripción.
 * Compartido entre SubscriptionPage (ya logueado, en gracia) y el login bloqueado por
 * suscripción vencida — mismo mensaje en ambos casos. */
export const buildWhatsappRenewalUrl = (businessName: string, phone: string | null | undefined): string | null => {
    if (!phone) return null;

    const message = [
        `Hola, soy ${businessName}.`,
        `Quiero renovar mi suscripción y adjunto mi comprobante de pago.`,
        `Quedo pendiente de confirmación. ¡Gracias!`,
    ].join(" ");

    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
};

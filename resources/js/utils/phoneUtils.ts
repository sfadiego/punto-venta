const PHONE_REGEX = /^\+?[\d]{10,12}$/;
const PHONE_MAX_LENGTH = 13; // '+' + 12 digits

export const isValidPhone = (phone: string): boolean => PHONE_REGEX.test(phone);

export const phoneValidationMessage = "Ingresa un teléfono válido (10-12 dígitos)";

export const sanitizePhoneInput = (value: string): string => {
    const sanitized = value.replace(/[^\d+]/g, "");
    return sanitized.length <= PHONE_MAX_LENGTH ? sanitized : sanitized.slice(0, PHONE_MAX_LENGTH);
};

/** Strips non-digits and returns the last 10 digits for comparison.
 *  "523121166870" and "3121166870" normalize to the same value. */
export const normalizePhone = (phone: string): string =>
    phone.replace(/\D/g, "").slice(-10);

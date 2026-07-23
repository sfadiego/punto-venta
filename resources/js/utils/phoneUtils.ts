const PHONE_REGEX = /^\+?[\d]{10,12}$/;
const PHONE_MAX_LENGTH = 13; // '+' + 12 digits

/** True for digit strings with no real variety: all-same ("0000000000"),
 *  strictly sequential ("1234567890"/"0987654321"), or a short unit repeated
 *  to fill the length ("123123123123") — patterns a real phone number never has. */
const hasLowEntropy = (digits: string): boolean => {
    if (/^(\d)\1+$/.test(digits)) return true;

    // Cyclic (mod 10) so "1234567890" (wraps 9→0) is caught the same as "0123456789".
    const isSequential = digits
        .split("")
        .every((d, i, arr) => i === 0 || (Number(d) - Number(arr[i - 1]) + 10) % 10 === 1);
    const isReverseSequential = digits
        .split("")
        .every((d, i, arr) => i === 0 || (Number(arr[i - 1]) - Number(d) + 10) % 10 === 1);
    if (isSequential || isReverseSequential) return true;

    for (let period = 1; period <= digits.length / 2; period++) {
        if (digits.length % period !== 0) continue;
        const unit = digits.slice(0, period);
        if (unit.repeat(digits.length / period) === digits) return true;
    }

    return false;
};

export const isValidPhone = (phone: string): boolean => {
    if (!PHONE_REGEX.test(phone)) return false;
    return !hasLowEntropy(phone.replace(/^\+/, ""));
};

export const phoneValidationMessage = "Ingresa un teléfono válido (10-12 dígitos)";

export const sanitizePhoneInput = (value: string): string => {
    const sanitized = value.replace(/[^\d+]/g, "");
    return sanitized.length <= PHONE_MAX_LENGTH ? sanitized : sanitized.slice(0, PHONE_MAX_LENGTH);
};

/** Strips non-digits and returns the last 10 digits for comparison.
 *  "523121166870" and "3121166870" normalize to the same value. */
export const normalizePhone = (phone: string): string =>
    phone.replace(/\D/g, "").slice(-10);

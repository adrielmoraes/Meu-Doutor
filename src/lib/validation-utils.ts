/**
 * Validation utilities for Brazilian documents and formats
 */

/**
 * Validates a Brazilian CPF
 * @param cpf - CPF string (can be formatted or not)
 * @returns true if valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
    if (!cpf) return false;

    // Remove non-numeric characters
    const cleaned = cpf.replace(/\D/g, '');

    // Check if has 11 digits
    if (cleaned.length !== 11) return false;

    // Check for known invalid CPFs (all digits the same)
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleaned.charAt(9))) return false;

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleaned.charAt(10))) return false;

    return true;
}

/**
 * Formats a CPF string
 * @param cpf - CPF string
 * @returns formatted CPF (000.000.000-00) or original if invalid
 */
export function formatCPF(cpf: string): string {
    if (!cpf) return '';

    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return cpf;

    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Validates a Brazilian phone number
 * @param phone - Phone string
 * @returns true if valid (10 or 11 digits), false otherwise
 */
export function validatePhone(phone: string): boolean {
    if (!phone) return false;

    const cleaned = phone.replace(/\D/g, '');

    // Must have 10 (landline) or 11 (mobile) digits
    return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formats a Brazilian phone number
 * @param phone - Phone string
 * @returns formatted phone (00) 00000-0000 or (00) 0000-0000
 */
export function formatPhone(phone: string): string {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
        // Mobile: (00) 00000-0000
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
        // Landline: (00) 0000-0000
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone;
}

/**
 * Validates a date string
 * @param dateStr - Date string (YYYY-MM-DD)
 * @returns true if valid date, false otherwise
 */
export function validateDate(dateStr: string): boolean {
    if (!dateStr) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Removes all non-numeric characters from a string
 * @param str - Input string
 * @returns string with only numbers
 */
export function numbersOnly(str: string): string {
    return str.replace(/\D/g, '');
}

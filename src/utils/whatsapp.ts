/**
 * Opens WhatsApp conversation with a phone number
 * @param phone - Phone number (with or without formatting)
 * @param message - Optional pre-filled message
 */
export const openWhatsApp = (phone: string, message?: string): void => {
    // Remove all non-digit characters
    const formatted = phone.replace(/\D/g, '');

    // Build WhatsApp URL (assumes Brazilian number, add 55 if not present)
    const phoneWithCountry = formatted.startsWith('55') ? formatted : `55${formatted}`;
    const baseUrl = `https://wa.me/${phoneWithCountry}`;
    const url = message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;

    // Open in new tab
    window.open(url, '_blank');
};

/**
 * Copies text to clipboard
 * @param text - Text to copy
 * @returns Promise<boolean> - Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        } catch {
            return false;
        }
    }
};

/**
 * Formats phone number to WhatsApp display format
 * @param phone - Raw phone number
 * @returns Formatted string (e.g., "+55 11 99999-9999")
 */
export const formatPhoneForDisplay = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 13) {
        // Format: +55 11 99999-9999
        return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
    } else if (digits.length === 11) {
        // Format: 11 99999-9999
        return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    return phone;
};

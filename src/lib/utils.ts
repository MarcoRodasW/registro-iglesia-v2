import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a phone number to Honduran format: XXXX-XXXX
 * Takes only the first 8 digits and formats them as XXXX-XXXX
 */
export function formatPhone(phone: string): string {
	// Remove all non-numeric characters
	const digits = phone.replace(/\D/g, "").slice(0, 8);

	// Format as XXXX-XXXX
	if (digits.length > 4) {
		return `${digits.slice(0, 4)}-${digits.slice(4)}`;
	}

	return digits;
}

/**
 * Strips formatting from a phone number, leaving only digits
 */
export function stripPhoneFormatting(phone: string): string {
	return phone.replace(/\D/g, "");
}

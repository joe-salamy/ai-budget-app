import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas for thousands/millions/etc.
 * @param value - The number or string to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";

  // Convert to string and remove existing commas
  const stringValue = String(value).replace(/,/g, "");

  // Handle negative numbers and decimals
  const parts = stringValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add commas to integer part
  const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Reassemble with decimal if present
  return decimalPart !== undefined ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Remove commas from a formatted number string
 * @param value - The formatted string with commas
 * @returns Plain number string without commas
 */
export function parseNumberWithCommas(value: string): string {
  return value.replace(/,/g, "");
}

/**
 * Format date input with automatic slash insertion
 * @param value - The input value (e.g., "01012026" or "01/01/2026")
 * @returns Formatted date string (e.g., "01/01/2026")
 */
export function formatDateInput(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "");

  // Don't format if empty
  if (!numbers) return "";

  // Format based on length
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
}

/**
 * Parse formatted date string to remove slashes
 * @param value - The formatted date string (e.g., "01/01/2026")
 * @returns Date string without slashes (e.g., "01012026")
 */
export function parseDateInput(value: string): string {
  return value.replace(/\D/g, "");
}

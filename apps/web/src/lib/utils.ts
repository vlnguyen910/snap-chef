import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Masks an email address for privacy
 * Example: nguyenvana@gmail.com -> ngu***@gmail.com
 * @param email - The email address to mask
 * @returns Masked email address
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  
  // Show first 2-3 characters based on local part length
  const visibleChars = localPart.length <= 3 ? 1 : Math.min(3, localPart.length);
  const maskedLocal = localPart.substring(0, visibleChars) + '***';
  
  return `${maskedLocal}@${domain}`;
}

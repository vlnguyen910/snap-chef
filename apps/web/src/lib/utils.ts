import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const maskedName = name.length > 2 ? `${name.substring(0, 2)}***` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

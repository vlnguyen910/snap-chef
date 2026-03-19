import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskEmail(email: string) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return email;

  const name = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (!name || !domain) return email;
  const maskedName =
    name.length > 2 ? `${name.substring(0, 2)}***` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

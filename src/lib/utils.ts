import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return '??';
  
  
  if (name.startsWith('npub')) {
    return name.slice(4, 6).toUpperCase();
  }
  
  
  const words = name.split(' ');
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + (words[words.length - 1][0] || '')).toUpperCase();
}

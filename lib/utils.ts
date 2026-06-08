import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy · h:mm a");
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysUntil(date: Date | string): number {
  return differenceInDays(new Date(date), new Date());
}

export function priorityColor(priority: string) {
  return {
    low:    "text-neutral-600 bg-neutral-100",
    medium: "text-amber-600  bg-amber-50",
    high:   "text-red-600    bg-red-50",
  }[priority] ?? "text-neutral-500 bg-neutral-100";
}

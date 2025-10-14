import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function updateDisplayTime(timeString: string) {
  const [hours, minutes] = timeString.split(":");
  let displayHours = parseInt(hours, 10);
  const ampm = displayHours >= 12 ? "PM" : "AM";

  // Convert hours to 12-hour format
  displayHours = displayHours % 12;
  displayHours = displayHours ? displayHours : 12; // "0" becomes "12"

  return `${displayHours}:${minutes} ${ampm}`;
}

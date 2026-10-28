/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

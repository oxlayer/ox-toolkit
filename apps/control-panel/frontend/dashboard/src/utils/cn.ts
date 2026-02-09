/**
 * Classname utility
 *
 * Combines classnames using clsx
 */

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Utility function to download a file
 * @param filename - Name of the file to save
 * @param content - Content to save
 * @param mimeType - MIME type of the file
 */
export function save(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Utility function for classname merging (re-export from lib/utils)
 */
export { cn } from "../../../lib/utils";

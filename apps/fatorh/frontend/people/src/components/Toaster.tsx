import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast notification component using Sonner
 * Renders toast notifications for user feedback
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 5000,
        error: {
          duration: 5000,
        },
        success: {
          duration: 3000,
        },
      }}
    />
  );
}

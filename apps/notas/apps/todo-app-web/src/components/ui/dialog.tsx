import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  return (
    <DialogContext.Provider value={{ isOpen: open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error('DialogTrigger must be used within Dialog');
  }

  return (
    <button
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        context.setOpen(true);
      }}
      className={cn(className)}
      {...props}
    />
  );
});
DialogTrigger.displayName = 'DialogTrigger';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error('DialogContent must be used within Dialog');
  }

  if (!context.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => context.setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          'relative z-50 bg-background rounded-lg shadow-lg border p-6 w-full max-w-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
));
DialogTitle.displayName = 'DialogTitle';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter };

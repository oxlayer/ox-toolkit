"use client";

import { Field, FieldDescription } from "./field";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { cn } from "../../lib/utils";
import { tv, type VariantProps } from "tailwind-variants";
import { type ComponentProps, createContext, type HTMLAttributes, useContext, useId } from "react";

const choiceboxVariants = tv({
  base: ["flex flex-col gap-2"],
});

export type ChoiceboxProps = ComponentProps<typeof RadioGroup> &
  VariantProps<typeof choiceboxVariants>;

export const Choicebox = ({ className, ...props }: ChoiceboxProps) => (
  <RadioGroup className={cn(choiceboxVariants(), className)} {...props} />
);

type ChoiceboxItemContextValue = {
  value: string;
  id?: string;
};

const ChoiceboxItemContext = createContext<ChoiceboxItemContextValue | null>(null);

const useChoiceboxItemContext = () => {
  const context = useContext(ChoiceboxItemContext);

  if (!context) {
    throw new Error("useChoiceboxItemContext must be used within a ChoiceboxItem");
  }

  return context;
};

const choiceboxItemVariants = tv({
  slots: {
    item: [
      // Layout
      "relative inline-flex items-center",
      // Box Model
      "rounded-md border px-3 py-2",
      // Visual
      "bg-transparent transition-colors duration-150",
      "border-input",
      "not-disabled:hover:border-primary/50 not-disabled:hover:bg-muted/50",
      // Selected state (using :has to detect data-checked on child RadioGroupItem)
      "[&:has([data-checked])]:border-primary [&:has([data-checked])]:bg-primary/10",
      "[&:has([data-checked])]:hover:bg-primary/15",
      // Focus state
      "[&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-ring",
      "[&:has(:focus-visible)]:ring-offset-1",
      // Misc
    ],
    label: [
      // Layout
      "select-none",
      // Misc
      "cursor-pointer mb-0",
    ],
    radio: [
      // Layout
      "absolute",
      // Box Model
      "size-0",
      // Visual
      "opacity-0",
    ],
  },
  variants: {
    disabled: {
      true: {
        item: ["opacity-50 cursor-not-allowed"],
        label: ["cursor-not-allowed"],
      },
    },
  },
});

export type ChoiceboxItemProps = ComponentProps<typeof RadioGroupItem> &
  VariantProps<typeof choiceboxItemVariants>;

export const ChoiceboxItem = ({
  className,
  children,
  value,
  id,
  disabled,
  ...props
}: ChoiceboxItemProps) => {
  const reactId = useId();
  const itemId = id || reactId;
  const styles = choiceboxItemVariants({ disabled: !!disabled });

  return (
    <ChoiceboxItemContext.Provider value={{ value, id: itemId }}>
      <div data-slot="choicebox-item" className={cn(styles.item(), className)}>
        <Label htmlFor={String(itemId)} className={styles.label()}>
          <RadioGroupItem
            value={value}
            id={itemId}
            className={styles.radio()}
            disabled={disabled ?? false}
            {...props}
          />
          <Field className="gap-1.5">{children}</Field>
        </Label>
      </div>
    </ChoiceboxItemContext.Provider>
  );
};

const choiceboxItemHeaderVariants = tv({
  base: [
    // Layout
    "flex items-center gap-2",
  ],
});

export type ChoiceboxItemHeaderProps = ComponentProps<"div"> &
  VariantProps<typeof choiceboxItemHeaderVariants>;

export const ChoiceboxItemHeader = ({ className, ...props }: ChoiceboxItemHeaderProps) => (
  <div className={cn(choiceboxItemHeaderVariants(), className)} {...props} />
);

const choiceboxItemTitleVariants = tv({
  base: [
    // Typography
    "font-medium text-sm leading-none",
  ],
});

export type ChoiceboxItemTitleProps = ComponentProps<"div"> &
  VariantProps<typeof choiceboxItemTitleVariants>;

export const ChoiceboxItemTitle = ({ className, ...props }: ChoiceboxItemTitleProps) => (
  <div className={cn(choiceboxItemTitleVariants(), className)} {...props} />
);

const choiceboxItemSubtitleVariants = tv({
  base: [
    // Typography
    "font-normal text-muted-foreground text-xs",
  ],
});

export type ChoiceboxItemSubtitleProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof choiceboxItemSubtitleVariants>;

export const ChoiceboxItemSubtitle = ({ className, ...props }: ChoiceboxItemSubtitleProps) => (
  <span className={cn(choiceboxItemSubtitleVariants(), className)} {...props} />
);

export type ChoiceboxItemDescriptionProps = ComponentProps<typeof FieldDescription>;

export const ChoiceboxItemDescription = ({
  className,
  ...props
}: ChoiceboxItemDescriptionProps) => (
  <FieldDescription {...(className !== undefined ? { className } : {})} {...props} />
);

export type ChoiceboxIndicatorProps = Partial<ComponentProps<typeof RadioGroupItem>>;

export const ChoiceboxIndicator = (props: ChoiceboxIndicatorProps) => {
  const context = useChoiceboxItemContext();

  return (
    <RadioGroupItem
      {...props}
      id={`${context.id}-indicator`}
      value={context.value}
      aria-hidden="true"
      tabIndex={-1}
      disabled
      data-indicator=""
    />
  );
};

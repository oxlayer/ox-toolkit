"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "./combobox";
import { cn } from "../../lib/utils";
import { type ComponentProps, type ReactNode, useMemo, createContext, useContext } from "react";

type TagItem = { label: string; value: string };

const TagsContext = createContext<{ items: TagItem[] }>({ items: [] });

const useTagsContext = () => useContext(TagsContext);

export type TagsProps = {
  value?: string[];
  setValue?: (value: string[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  items: TagItem[];
  children?: ReactNode;
  className?: string;
};

export const Tags = ({
  value = [],
  setValue,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  items,
  children,
  className,
}: TagsProps) => {
  // Convert string[] to items format for Combobox
  const selectedItems = useMemo(() => {
    return items.filter(item => value.includes(item.value));
  }, [items, value]);

  const handleValueChange = (newItems: TagItem[]) => {
    const newValues = newItems.map(item => item.value);
    setValue?.(newValues);
  };

  return (
    <TagsContext.Provider value={{ items }}>
      <div {...(className !== undefined ? { className } : {})}>
        <Combobox
          multiple
          value={selectedItems}
          onValueChange={handleValueChange}
          items={items}
          {...(controlledOpen !== undefined ? { open: controlledOpen } : {})}
          {...(controlledOnOpenChange !== undefined
            ? { onOpenChange: controlledOnOpenChange }
            : {})}
        >
          {children}
        </Combobox>
      </div>
    </TagsContext.Provider>
  );
};

export type TagsTriggerProps = {
  className?: string;
  children?: ReactNode;
  placeholder?: string;
};

export const TagsTrigger = ({
  className,
  children,
  placeholder = "Select a tag...",
}: TagsTriggerProps) => {
  return (
    <ComboboxChips {...(className !== undefined ? { className } : {})}>
      <ComboboxValue>
        {(value: TagItem[]) => (
          <>
            {value?.map(item => (
              <ComboboxChip aria-label={item.label} key={item.value}>
                {item.label}
              </ComboboxChip>
            ))}
            <ComboboxInput
              aria-label="Select a tag"
              {...(value.length > 0 ? {} : { placeholder })}
            />
          </>
        )}
      </ComboboxValue>
      {children}
    </ComboboxChips>
  );
};

export type TagsContentProps = {
  className?: string;
  children?: ReactNode;
};

export const TagsContent = ({ className, children }: TagsContentProps) => {
  return (
    <ComboboxPopup {...(className !== undefined ? { className } : {})}>{children}</ComboboxPopup>
  );
};

export type TagsInputProps = ComponentProps<typeof ComboboxInput>;

export const TagsInput = ({ className, ...props }: TagsInputProps) => (
  <ComboboxInput {...props} {...(className !== undefined ? { className } : {})} />
);

export type TagsListProps = ComponentProps<typeof ComboboxList>;

export const TagsList = ({ className, ...props }: TagsListProps) => (
  <ComboboxList {...props} {...(className !== undefined ? { className } : {})} />
);

export type TagsEmptyProps = ComponentProps<typeof ComboboxEmpty>;

export const TagsEmpty = ({ children, ...props }: TagsEmptyProps) => (
  <ComboboxEmpty {...props}>{children ?? "No tags found."}</ComboboxEmpty>
);

export type TagsGroupProps = {
  children?: ReactNode;
};

export const TagsGroup = ({ children }: TagsGroupProps) => {
  return <>{children}</>;
};

export type TagsItemProps = ComponentProps<typeof ComboboxItem> & {
  value: string;
  children?: ReactNode;
};

export const TagsItem = ({ className, value, children, ...props }: TagsItemProps) => {
  const { items } = useTagsContext();

  // Find the item object from the items array
  const item = items.find(i => i.value === value);

  if (!item) {
    // Fallback: create item from value and children
    const fallbackItem: TagItem = {
      value,
      label: String(children ?? value),
    };

    return (
      <ComboboxItem
        className={cn("cursor-pointer items-center justify-between", className)}
        value={fallbackItem}
        {...props}
      >
        {children}
      </ComboboxItem>
    );
  }

  return (
    <ComboboxItem
      className={cn("cursor-pointer items-center justify-between", className)}
      value={item}
      {...props}
    >
      {children}
    </ComboboxItem>
  );
};

"use client";

import { DndContext, rectIntersection, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { VariantProps } from "class-variance-authority";
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "../../lib/utils";

import { Item, ItemGroup } from "./item";

export type { DragEndEvent } from "@dnd-kit/core";

type Status = {
  id: string;
  name: string;
  color: string;
};

// Drag handle context for restricting drag to specific elements
type ItemListDragHandleContextValue = ReturnType<typeof useSortable>;

const ItemListDragHandleContext = createContext<ItemListDragHandleContextValue | null>(null);

function ItemListDragHandleProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ItemListDragHandleContextValue;
}) {
  return (
    <ItemListDragHandleContext.Provider value={value}>
      {children}
    </ItemListDragHandleContext.Provider>
  );
}

export function useItemListDragHandle() {
  const context = useContext(ItemListDragHandleContext);
  if (!context) {
    throw new Error("useItemListDragHandle must be used within ItemListItem");
  }
  return context;
}

export type ItemListProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  items?: string[];
  className?: string;
};

export const ItemListProvider = ({
  children,
  onDragEnd,
  items,
  className,
}: ItemListProviderProps) => (
  <DndContext
    collisionDetection={rectIntersection}
    modifiers={[restrictToVerticalAxis]}
    onDragEnd={onDragEnd}
  >
    <div className={cn("flex size-full flex-col gap-1", className)}>
      {items ? (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      ) : (
        children
      )}
    </div>
  </DndContext>
);

export type ItemListGroupProps = {
  id: Status["id"];
  children: ReactNode;
  className?: string;
};

export const ItemListGroup = ({ id, children, className }: ItemListGroupProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn("transition-colors", isOver && "bg-foreground/10", className)}
    >
      <ItemGroup>{children}</ItemGroup>
    </div>
  );
};

export type ItemListHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const ItemListHeader = ({ children, className }: ItemListHeaderProps) => (
  <div
    className={cn(
      "flex items-start justify-between px-3 py-2 rounded mb-2 bg-card border",
      className
    )}
  >
    {children}
  </div>
);

export type ItemListTitleDotProps = {
  color: string;
  className?: string;
};

export const ItemListTitleDot = ({ color, className }: ItemListTitleDotProps) => (
  <div
    className={cn("h-2 w-2 rounded-full shrink-0", className)}
    style={{ backgroundColor: color }}
  />
);

export type ItemListTitleTextProps = {
  children: ReactNode;
  className?: string;
};

export const ItemListTitleText = ({ children, className }: ItemListTitleTextProps) => (
  <p className={cn("m-0 font-semibold text-sm", className)}>{children}</p>
);

export type ItemListTitleProps = {
  children: ReactNode;
  className?: string;
};

export const ItemListTitle = ({ children, className }: ItemListTitleProps) => (
  <div className={cn("flex shrink-0 items-center gap-2", className)}>{children}</div>
);

export type ItemListActionsProps = {
  children: ReactNode;
  className?: string;
};

export const ItemListActions = ({ children, className }: ItemListActionsProps) => (
  <div className={cn("flex shrink-0 items-center gap-2", className)}>{children}</div>
);

export type ItemListItemsProps = {
  children: ReactNode;
  className?: string;
};

export const ItemListItems = ({ children, className }: ItemListItemsProps) => (
  <div className={cn("flex flex-1 flex-col gap-2", className)}>{children}</div>
);

export type ItemListItemProps = {
  readonly id: string;
  readonly index: number;
  readonly parent: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly variant?: VariantProps<typeof Item>["variant"];
  readonly size?: VariantProps<typeof Item>["size"];
};

export const ItemListItem = ({
  id,
  index,
  parent,
  children,
  className,
  variant = "muted",
  size = "default",
}: ItemListItemProps) => {
  const sortable = useSortable({
    id,
    data: { index, parent },
  });

  const { transform, transition, isDragging, over, setNodeRef } = sortable;
  const isOver = over?.id === id;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <ItemListDragHandleProvider value={sortable}>
      <Item
        variant={variant}
        size={size}
        ref={setNodeRef}
        style={style}
        className={cn(
          [
            "py-2",
            "transition-shadow",
            "data-[dragging=true]:shadow-lg",
            "data-[dragging=true]:shadow-foreground/10",
            "data-[dragging=true]:bg-muted/50",
            "data-[dragging=true]:ring-1",
            "data-[dragging=true]:ring-ring/30",
            "data-[over=true]:ring-1",
            "data-[over=true]:ring-ring/20",
          ],
          className
        )}
        data-dragging={isDragging}
        data-over={isOver}
      >
        {children}
      </Item>
    </ItemListDragHandleProvider>
  );
};

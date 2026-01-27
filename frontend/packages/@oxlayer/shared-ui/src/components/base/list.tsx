"use client";

import { DndContext, type DragEndEvent, rectIntersection, useDroppable } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

export type { DragEndEvent } from "@dnd-kit/core";

export type ListItemsProps = {
  children: ReactNode;
  className?: string;
};

export const ListItems = ({ children, className }: ListItemsProps) => (
  <div className={cn("flex flex-1 flex-col gap-2 p-3", className)}>{children}</div>
);

export type ListHeaderProps =
  | {
      children: ReactNode;
    }
  | {
      name: string;
      color: string;
      className?: string;
    };

export const ListHeader = (props: ListHeaderProps) =>
  "children" in props ? (
    props.children
  ) : (
    <div className={cn("flex shrink-0 items-center gap-2 bg-foreground/5 p-3", props.className)}>
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: props.color }} />
      <p className="m-0 font-semibold text-sm">{props.name}</p>
    </div>
  );

export type ListGroupProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const ListGroup = ({ id, children, className }: ListGroupProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn("bg-secondary transition-colors", isOver && "bg-foreground/10", className)}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type ListItemProps = {
  id: string;
  name: string;
  readonly index: number;
  readonly parent: string;
  readonly children?: ReactNode;
  readonly className?: string;
};

export const ListItem = ({ id, name, index, parent, children, className }: ListItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { index, parent },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-md border bg-background p-2 shadow-sm",
        isDragging && "cursor-grabbing",
        className
      )}
      style={style}
      {...listeners}
      {...attributes}
      ref={setNodeRef}
    >
      {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
    </div>
  );
};

export type ListProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  items?: string[];
  className?: string;
};

export const ListProvider = ({ children, onDragEnd, items, className }: ListProviderProps) => (
  <DndContext
    collisionDetection={rectIntersection}
    modifiers={[restrictToVerticalAxis]}
    onDragEnd={onDragEnd}
  >
    <div className={cn("flex size-full flex-col", className)}>
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

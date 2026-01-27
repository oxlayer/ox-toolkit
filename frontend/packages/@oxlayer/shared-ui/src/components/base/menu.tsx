"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

const Menu = MenuPrimitive.Root;

const MenuPortal = MenuPrimitive.Portal;

function MenuTrigger({
  asChild,
  children,
  ...props
}: MenuPrimitive.Trigger.Props & {
  asChild?: boolean;
}) {
  if (asChild && React.isValidElement(children)) {
    return (
      <MenuPrimitive.Trigger
        data-slot="menu-trigger"
        render={(triggerProps: any) =>
          React.cloneElement(children as React.ReactElement<any>, triggerProps)
        }
        {...props}
      />
    );
  }
  return (
    <MenuPrimitive.Trigger data-slot="menu-trigger" {...props}>
      {children}
    </MenuPrimitive.Trigger>
  );
}

function MenuPopup({
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  side?: MenuPrimitive.Positioner.Props["side"];
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="z-50"
        data-slot="menu-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          className={cn(
            "relative flex origin-(--transform-origin) rounded-md border bg-popover bg-clip-padding shadow-lg transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-md)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] has-data-starting-style:scale-98 has-data-starting-style:opacity-0 dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
            className
          )}
          data-slot="menu-popup"
          {...props}
        >
          <div className="max-h-(--available-height) not-[class*='w-']:min-w-32 overflow-y-auto p-1">
            {children}
          </div>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function MenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />;
}

function MenuItem({
  className,
  inset,
  variant = "default",
  onSelect,
  onClick,
  asChild,
  children,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
  onSelect?: (e?: React.MouseEvent<HTMLElement>) => void;
  asChild?: boolean;
}) {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (onSelect) {
      onSelect(e);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const itemProps = {
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1 text-xs outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-inset:ps-8 data-[variant=destructive]:text-destructive-foreground data-highlighted:text-accent-foreground data-disabled:opacity-64  [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
      className
    ),
    "data-inset": inset,
    "data-slot": "menu-item",
    "data-variant": variant,
    ...props,
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return (
      <MenuPrimitive.Item
        {...itemProps}
        render={(renderProps: any) =>
          React.cloneElement(child, {
            ...child.props,
            ...renderProps,
            className: cn(itemProps.className, renderProps.className, child.props.className),
            onClick: (e: React.MouseEvent<HTMLElement>) => {
              renderProps.onClick?.(e);
              handleClick(e);
              child.props.onClick?.(e);
            },
          })
        }
      />
    );
  }

  return (
    <MenuPrimitive.Item {...itemProps} onClick={handleClick}>
      {children}
    </MenuPrimitive.Item>
  );
}

function MenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn(
        "grid in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1 ps-2 pe-4 text-xs outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-64  [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="menu-checkbox-item"
      {...props}
      {...(checked !== undefined ? { checked } : {})}
    >
      <MenuPrimitive.CheckboxItemIndicator className="col-start-1">
        <CheckIcon />
      </MenuPrimitive.CheckboxItemIndicator>
      <span className="col-start-2">{children}</span>
    </MenuPrimitive.CheckboxItem>
  );
}

function MenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />;
}

function MenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        "grid in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1 ps-2 pe-4 text-xs outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-64  [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="menu-radio-item"
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className="col-start-1">
        <CheckIcon />
      </MenuPrimitive.RadioItemIndicator>
      <span className="col-start-2">{children}</span>
    </MenuPrimitive.RadioItem>
  );
}

function MenuGroupLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn(
        "px-2 py-1.5 font-medium text-muted-foreground text-xs data-inset:ps-9 sm:data-inset:ps-8",
        className
      )}
      data-inset={inset}
      data-slot="menu-label"
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      className={cn("mx-2 my-1 h-px bg-border", className)}
      data-slot="menu-separator"
      {...props}
    />
  );
}

function MenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("ms-auto text-muted-foreground/64 text-xs tracking-widest", className)}
      data-slot="menu-shortcut"
      {...props}
    />
  );
}

function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />;
}

function MenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-inset:ps-8 data-highlighted:text-accent-foreground data-disabled:opacity-64  [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className
      )}
      data-inset={inset}
      data-slot="menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function MenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset = -4,
  align = "start",
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
}) {
  return (
    <MenuPopup
      align={align}
      alignOffset={alignOffset}
      data-slot="menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
      {...(className !== undefined ? { className } : {})}
    />
  );
}

export {
  Menu,
  MenuCheckboxItem,
  MenuPopup as MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuGroupLabel as MenuLabel,
  MenuPopup,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup as MenuSubContent,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
};

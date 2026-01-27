"use client";

import { cn } from "../../lib/utils";
import { useEffect, useRef, type KeyboardEvent } from "react";

interface ContentEditableProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export function ContentEditable({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  "aria-label": ariaLabelProp,
}: ContentEditableProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (
      ref.current &&
      ref.current.textContent !== value &&
      document.activeElement !== ref.current
    ) {
      ref.current.textContent = value;
    }
  }, [value]);
  const handleInput = () => {
    onChange(ref.current?.textContent || "");
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    ref.current?.focus();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    onChange(ref.current?.textContent || "");
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ref.current?.blur();
    }
  };
  const ariaLabel = ariaLabelProp || (value?.trim() ? value : placeholder);
  return (
    <h1
      id={id}
      ref={ref}
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
      aria-label={ariaLabel}
      className={cn(
        "min-h-[40px] outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
        className
      )}
      data-placeholder={placeholder}
    />
  );
}

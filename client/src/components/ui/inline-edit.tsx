import { useState, useRef, useEffect, KeyboardEvent, ReactNode } from "react";

export interface EditableProps {
  children: ReactNode;
  onEdit: () => void;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * Editable component - wrapper for content that can be edited on click/double-click
 */
export const Editable = ({ 
  children, 
  onEdit, 
  align = "left", 
  disabled = false,
  "aria-label": ariaLabel
}: EditableProps) => {
  const isEmpty = children === "" || (typeof children === "number" && children === 0);

  return (
    <span
      className={`cursor-text ${align === "center" ? "mx-auto" : ""} ${align === "right" ? "text-right" : ""}`}
      onClick={(e) => {
        e.stopPropagation(); // Block Accordion toggle
        if (isEmpty && !disabled) onEdit(); // still open editor when blank
      }}
      onDoubleClick={(e) => {
        e.stopPropagation(); // Block Accordion toggle
        if (!disabled) onEdit(); // open editor on double‑click
      }}
      title={isEmpty ? "Click to edit" : "Double‑click to edit"}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || (isEmpty ? "Click to add content" : "Double-click to edit content")}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onEdit();
        }
      }}
    >
      {isEmpty ? <em className="text-muted-foreground">Click to edit</em> : children}
    </span>
  );
};

export interface EditableSpanProps {
  value: string;
  onSave: (newVal: string) => void;
  align?: "left" | "center" | "right";
  numeric?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * EditableSpan component - inline editable field that transforms into an input on render
 */
export const EditableSpan = ({
  value,
  onSave,
  align = "left",
  numeric = false,
  autoFocus = true,
  placeholder = "",
  "aria-label": ariaLabel
}: EditableSpanProps) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when it renders if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave(inputValue);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onSave(value); // Revert to original
    }
  };

  return (
    <input
      ref={inputRef}
      type={numeric ? "number" : "text"}
      className={`w-full bg-transparent p-1 border rounded focus:ring-2 focus:ring-primary outline-none ${
        align === "center" ? "text-center" : ""
      } ${align === "right" ? "text-right" : ""}`}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={() => onSave(inputValue)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      aria-label={ariaLabel || "Edit field"}
    />
  );
};
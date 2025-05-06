import React, { useState, useEffect, useRef, KeyboardEvent, ReactNode } from "react";
import { Input } from "./input";

interface EditableProps {
  children: ReactNode;
  onEdit: () => void;
  align?: "left" | "center" | "right";
  "aria-label"?: string;
}

interface EditableSpanProps {
  value: string;
  onSave: (value?: string) => void;
  align?: "left" | "center" | "right";
  numeric?: boolean;
  "aria-label"?: string;
}

/**
 * Wraps content to make it appear editable
 * Provides visual indication and handle click/double-click behavior
 */
export const Editable: React.FC<EditableProps> = ({
  children,
  onEdit,
  align = "left",
  "aria-label": ariaLabel,
}) => {
  const isEmpty = !children || (typeof children === "string" && children.trim() === "");
  const handleClick = () => {
    // Single click for empty fields, double click for filled fields
    if (isEmpty) {
      onEdit();
    }
  };
  
  const handleDoubleClick = () => {
    // Only trigger edit on double-click for non-empty fields
    if (!isEmpty) {
      onEdit();
    }
  };

  const alignmentClass = 
    align === "center" ? "text-center" : 
    align === "right" ? "text-right" : 
    "text-left";

  return (
    <div
      className={`${alignmentClass} cursor-pointer min-h-[1.5rem] ${isEmpty ? "text-muted-foreground italic" : ""} hover:bg-accent/20 rounded px-1`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
    >
      {isEmpty ? "Click to edit" : children}
    </div>
  );
};

/**
 * Editable span component that turns into an input field when active
 */
export const EditableSpan: React.FC<EditableSpanProps> = ({
  value,
  onSave,
  align = "left",
  numeric = false,
  "aria-label": ariaLabel,
}) => {
  const [editedValue, setEditedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSave(editedValue);
    } else if (e.key === "Escape") {
      onSave(); // Cancel editing
    }
  };

  const handleBlur = () => {
    onSave(editedValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (numeric) {
      // Allow only numeric input (including decimal)
      const value = e.target.value;
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setEditedValue(value);
      }
    } else {
      setEditedValue(e.target.value);
    }
  };

  const alignmentClass = 
    align === "center" ? "text-center" : 
    align === "right" ? "text-right" : 
    "text-left";

  return (
    <Input
      ref={inputRef}
      type={numeric ? "text" : "text"}
      value={editedValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`${alignmentClass} h-8 py-0 px-1`}
      aria-label={ariaLabel}
    />
  );
};
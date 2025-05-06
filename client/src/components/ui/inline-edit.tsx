import { useEffect, useRef } from "react";

/** A <span contentEditable> that autosaves on blur / Enter */
export const EditableSpan = ({
  value,
  onSave,
  align = "left",
  numeric = false,
}: {
  value: string;
  onSave: (newVal: string) => void;
  align?: "left" | "center";
  numeric?: boolean;
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  // focus and select text when span appears
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      document.execCommand("selectAll", false);
    }
  }, []);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`outline-none bg-transparent block ${align === "center" ? "text-center" : ""}`}
      onBlur={() => onSave((ref.current?.innerText.trim() || (numeric ? "0" : "")) as string)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // keep it one line
          (e.target as HTMLSpanElement).blur();
        } else if (e.key === "Escape") {
          (e.target as HTMLElement).blur(); // cancel, just triggers onBlur with same value
        }
      }}
    >
      {value}
    </span>
  );
};

/** Wrapper that shows normal text but turns editable on click(s) */
export const Editable = ({
  children,
  onEdit,
  align = "left",
}: {
  children: string | number;
  onEdit: () => void;
  align?: "center" | "left";
}) => {
  const isEmpty = children === "" || (typeof children === "number" && children === 0);

  return (
    <span
      className={`cursor-text ${align === "center" ? "mx-auto" : ""}`}
      onClick={() => {
        if (isEmpty) onEdit(); // single click if empty
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(); // always double‑click to edit
      }}
      title={isEmpty ? "Click to edit" : "Double‑click to edit"}
    >
      {isEmpty ? <span className="text-gray-500">Click to edit</span> : children}
    </span>
  );
};

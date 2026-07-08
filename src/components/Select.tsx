import { useEffect, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "./icons";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
}

// Dropdown custom maison (les <select> natifs non stylises sont interdits).
// Volontairement simple : pas de recherche ni multi-select.
export default function Select({ value, onChange, options, label }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {label && <span className="mb-1 block text-sm text-smoke">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-1 rounded-lg border border-seam bg-chalk px-3 py-2 text-left text-ink outline-none transition-colors duration-150 focus-visible:border-klein focus-visible:ring-1 focus-visible:ring-klein"
      >
        <span className="truncate">{current?.label ?? ""}</span>
        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-smoke transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 origin-top animate-scale-in overflow-y-auto rounded-lg border border-seam bg-white py-1 shadow-lg"
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => pick(o.value)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition-colors duration-150 hover:bg-chalk focus-visible:bg-chalk focus-visible:outline-none"
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <IconCheck className="h-4 w-4 shrink-0 text-klein" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Icones SVG inline maison, style ligne fine coherent.
// viewBox 24x24, stroke 1.75, currentColor. Taille via className (ex. "h-5 w-5").

interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true
} as const;

export function IconHeart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.5 4.8 13.36a4.85 4.85 0 0 1 6.86-6.86l.34.34.34-.34a4.85 4.85 0 0 1 6.86 6.86L12 20.5Z" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconArrowUp({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 19.5v-14M5.75 11.75 12 5.5l6.25 6.25" />
    </svg>
  );
}

export function IconFilter({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 6.5h15M7.5 12h9M10.5 17.5h3" />
    </svg>
  );
}

export function IconCompass({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6 4.6-1.8Z" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.75" />
      <path d="m20 20-4.5-4.5" />
    </svg>
  );
}

export function IconBookmark({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M17.75 20.5 12 16.75 6.25 20.5V5.25c0-.97.78-1.75 1.75-1.75h8c.97 0 1.75.78 1.75 1.75V20.5Z" />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M5.25 20.25a6.75 6.75 0 0 1 13.5 0" />
    </svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5.5 12.5 4.25 4.25L18.5 7.5" />
    </svg>
  );
}

export function IconSparkles({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M11 4.5l1.6 4.4 4.4 1.6-4.4 1.6L11 16.5l-1.6-4.4L5 10.5l4.4-1.6L11 4.5Z" />
      <path d="m18 14.5 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  );
}

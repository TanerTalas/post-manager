import type { JSX } from 'preact';

interface Props {
  size?: number;
  width?: number;
  stroke?: string;
  style?: string | JSX.CSSProperties;
  children: JSX.Element | JSX.Element[];
}

/** Shared wrapper so every inline glyph keeps the same stroke conventions. */
export function Icon({ size = 16, width = 1.6, stroke = 'currentColor', style, children }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      stroke-width={width}
      stroke-linecap="round"
      stroke-linejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

export const paths = {
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m5 13 4 4L19 7" />,
  pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />,
  help: (
    <>
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.6-2.9 4.3" />
      <path d="M12 18h.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </>
  ),
  back: (
    <>
      <path d="M20 7a5 5 0 0 1-5 5H5" />
      <path d="m9 8-4 4 4 4" />
    </>
  ),
};

import React from "react";

/**
 * The Study Anchor mark: an open book with a peach bookmark ribbon.
 * Matches the installed app icon exactly, so the home-screen tile and the
 * in-app header read as the same product.
 */
export default function BrandMark({ className = "h-9 w-9", rounded = true }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Study Anchor">
      <rect width="48" height="48" rx={rounded ? 11 : 0} fill="#2d3250" />
      <path d="M9.6 16.6 22.6 19.9 22.6 34.1 9.6 30.8Z" fill="#ffffff" />
      <path d="M38.4 16.6 25.4 19.9 25.4 34.1 38.4 30.8Z" fill="#ffffff" />
      <g stroke="#2d3250" strokeWidth="1.1" strokeLinecap="round">
        <path d="M12 21.6 20.2 23.6M12 24.6 20.2 26.6M12 27.6 20.2 29.6" />
        <path d="M36 21.6 27.8 23.6M36 24.6 27.8 26.6M36 27.6 27.8 29.6" />
      </g>
      <path d="M21.4 14.6h5.2v13.1L24 25.2l-2.6 2.5Z" fill="#f9b17a" />
    </svg>
  );
}

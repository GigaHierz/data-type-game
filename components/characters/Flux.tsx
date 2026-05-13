"use client";

/** FLUX — Short-Term Memory. Translucent CRT, soft flicker. */
export function Flux({ size = 200 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className="animate-flicker"
      aria-label="FLUX — Short-Term Memory"
    >
      <defs>
        <linearGradient id="flux-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6F4EF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E9E6DE" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* base */}
      <rect x="60" y="170" width="100" height="14" rx="3" fill="#E9E6DE" stroke="#181EA9" strokeWidth="2" />
      <rect x="78" y="158" width="64" height="14" fill="#E9E6DE" stroke="#181EA9" strokeWidth="2" />

      {/* monitor body */}
      <rect
        x="34"
        y="34"
        width="152"
        height="124"
        rx="14"
        fill="url(#flux-glass)"
        stroke="#181EA9"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      {/* screen */}
      <rect
        x="52"
        y="52"
        width="116"
        height="88"
        rx="6"
        fill="#F6F4EF"
        stroke="#181EA9"
        strokeWidth="1.5"
      />
      {/* scanline */}
      <rect
        x="52"
        y="52"
        width="116"
        height="2"
        fill="#181EA9"
        opacity="0.15"
        style={{ animation: "scan 3.6s linear infinite", transformOrigin: "0 0" }}
      />

      {/* eyes — sleepy, drifty */}
      <g style={{ transformOrigin: "90px 92px", animation: "blinkSlow 5s infinite" }}>
        <ellipse cx="90" cy="92" rx="10" ry="6" fill="#181EA9" />
      </g>
      <g style={{ transformOrigin: "130px 92px", animation: "blinkSlow 5.4s infinite" }}>
        <ellipse cx="130" cy="92" rx="10" ry="6" fill="#181EA9" />
      </g>
      {/* mouth — wavy, uncertain */}
      <path
        d="M 80 118 q 10 -4 20 0 t 20 0"
        stroke="#181EA9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* dotted memory leak */}
      <g fill="#FE7446">
        <circle cx="190" cy="60" r="1.5" />
        <circle cx="196" cy="72" r="1" />
        <circle cx="201" cy="85" r="0.8" />
      </g>
    </svg>
  );
}

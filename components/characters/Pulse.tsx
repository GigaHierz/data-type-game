"use client";

/** PULSE — Heart Data. A tiny handheld device, hot orange, vibrating. */
export function Pulse({ size = 180 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={(size * 220) / 200}
      className="animate-jitter"
      aria-label="PULSE — Heart Data"
    >
      {/* heat haze */}
      <defs>
        <radialGradient id="pulse-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FE7446" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FE7446" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="120" rx="110" ry="60" fill="url(#pulse-glow)" />

      {/* body */}
      <rect
        x="50"
        y="40"
        width="100"
        height="140"
        rx="14"
        fill="#FE7446"
        stroke="#111"
        strokeWidth="3"
      />
      {/* screen */}
      <rect
        x="62"
        y="58"
        width="76"
        height="58"
        rx="3"
        fill="#111"
        stroke="#111"
        strokeWidth="2"
      />
      {/* eyes — wide, hot */}
      <circle cx="84" cy="86" r="9" fill="#F6F4EF" />
      <circle cx="116" cy="86" r="9" fill="#F6F4EF" />
      <circle cx="84" cy="86" r="3.5" fill="#FE7446" />
      <circle cx="116" cy="86" r="3.5" fill="#FE7446" />
      {/* squiggle mouth */}
      <path
        d="M 70 134 q 8 -8 16 0 t 16 0 t 16 0 t 16 0"
        stroke="#111"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* fan vent */}
      <g transform="translate(100 160)">
        <circle r="14" fill="#111" />
        <g style={{ transformOrigin: "center", animation: "sweep 0.25s linear infinite" }}>
          <rect x="-12" y="-1.5" width="24" height="3" fill="#FE7446" />
        </g>
      </g>
      {/* antenna */}
      <line x1="100" y1="40" x2="100" y2="20" stroke="#111" strokeWidth="3" />
      <circle cx="100" cy="18" r="4" fill="#FE7446" stroke="#111" strokeWidth="2" />
      {/* sweat */}
      <circle cx="46" cy="60" r="3" fill="#181EA9" />
      <circle cx="156" cy="68" r="2.5" fill="#181EA9" />
    </svg>
  );
}

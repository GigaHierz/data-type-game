"use client";

/** CACHE — The Archive. Sleek, online, sunglasses. */
export function Cache({ size = 200 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className="animate-hover"
      aria-label="CACHE — The Archive"
    >
      {/* hover shadow */}
      <ellipse cx="110" cy="200" rx="50" ry="6" fill="#11111133" />

      {/* flat panel */}
      <rect
        x="30"
        y="38"
        width="160"
        height="120"
        rx="10"
        fill="#181EA9"
        stroke="#111"
        strokeWidth="3"
      />
      {/* glossy strip */}
      <rect x="30" y="38" width="160" height="14" rx="10" fill="#FE7446" />
      <text
        x="42"
        y="49"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        fill="#111"
        letterSpacing="2"
      >
        [ CACHE ]
      </text>

      {/* face area */}
      <rect x="42" y="60" width="136" height="86" rx="4" fill="#0d127a" />

      {/* sunglasses bar */}
      <rect x="50" y="88" width="124" height="16" rx="2" fill="#111" />
      {/* lens highlights */}
      <rect x="60" y="90" width="40" height="6" fill="#FE7446" opacity="0.6" />
      <rect x="120" y="90" width="40" height="6" fill="#FE7446" opacity="0.6" />
      {/* nose bridge */}
      <rect x="108" y="90" width="4" height="12" fill="#111" />

      {/* smirk */}
      <path
        d="M 86 128 q 24 10 48 -4"
        stroke="#F6F4EF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* hover feet */}
      <rect x="78" y="160" width="14" height="22" fill="#111" />
      <rect x="128" y="160" width="14" height="22" fill="#111" />
      {/* glow under feet */}
      <ellipse cx="85" cy="190" rx="10" ry="3" fill="#FE7446" />
      <ellipse cx="135" cy="190" rx="10" ry="3" fill="#FE7446" />
    </svg>
  );
}

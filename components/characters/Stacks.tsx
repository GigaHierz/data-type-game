"use client";

/** STACKS — Forever Memory. Chunky beige tower, monocle, slow blink. */
export function Stacks({ size = 200 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 220 240"
      width={size}
      height={(size * 240) / 220}
      aria-label="STACKS — Forever Memory"
    >
      {/* tower body */}
      <rect
        x="44"
        y="24"
        width="132"
        height="200"
        rx="8"
        fill="#E9E6DE"
        stroke="#111"
        strokeWidth="3"
      />
      {/* wood panel inlay */}
      <rect x="52" y="32" width="116" height="184" rx="4" fill="#d6c8a8" stroke="#111" strokeWidth="2" />
      <line x1="60" y1="40" x2="60" y2="208" stroke="#a08960" strokeWidth="1" />
      <line x1="76" y1="40" x2="76" y2="208" stroke="#a08960" strokeWidth="1" />
      <line x1="92" y1="40" x2="92" y2="208" stroke="#a08960" strokeWidth="1" />
      <line x1="108" y1="40" x2="108" y2="208" stroke="#a08960" strokeWidth="1" />
      <line x1="124" y1="40" x2="124" y2="208" stroke="#a08960" strokeWidth="1" />
      <line x1="140" y1="40" x2="140" y2="208" stroke="#a08960" strokeWidth="1" />
      <line x1="156" y1="40" x2="156" y2="208" stroke="#a08960" strokeWidth="1" />

      {/* face plate */}
      <rect x="64" y="60" width="92" height="60" rx="4" fill="#F6F4EF" stroke="#111" strokeWidth="2" />

      {/* eyes */}
      <g style={{ transformOrigin: "88px 90px", animation: "blinkSlow 8s infinite" }}>
        <circle cx="88" cy="90" r="6" fill="#111" />
      </g>
      <g style={{ transformOrigin: "132px 90px", animation: "blinkSlow 8.5s infinite" }}>
        <circle cx="132" cy="90" r="6" fill="#111" />
      </g>
      {/* monocle on right eye */}
      <circle cx="132" cy="90" r="11" fill="none" stroke="#111" strokeWidth="2" />
      <line x1="143" y1="90" x2="156" y2="104" stroke="#111" strokeWidth="1.5" />

      {/* gentle smile */}
      <path
        d="M 92 110 q 18 6 36 0"
        stroke="#111"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* slots like floppy/drive bays */}
      <rect x="68" y="132" width="84" height="6" rx="1" fill="#a08960" />
      <rect x="68" y="146" width="84" height="6" rx="1" fill="#a08960" />
      <rect x="68" y="160" width="50" height="6" rx="1" fill="#a08960" />
      <circle cx="146" cy="163" r="3" fill="#FE7446" />

      {/* tea steam */}
      <g stroke="#111" strokeWidth="1.5" fill="none" opacity="0.6">
        <path d="M 30 30 q -4 -8 0 -14 q 4 -6 0 -12" />
        <path d="M 38 28 q -4 -8 0 -14" />
      </g>
      {/* tea cup */}
      <rect x="20" y="30" width="22" height="12" rx="2" fill="#F6F4EF" stroke="#111" strokeWidth="2" />

      {/* dust */}
      <g fill="#111" opacity="0.15">
        <circle cx="56" cy="28" r="1" />
        <circle cx="80" cy="30" r="0.6" />
        <circle cx="140" cy="29" r="0.8" />
      </g>

      {/* feet */}
      <rect x="60" y="224" width="20" height="10" fill="#111" />
      <rect x="140" y="224" width="20" height="10" fill="#111" />
    </svg>
  );
}

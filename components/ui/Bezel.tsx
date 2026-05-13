"use client";

import { type ReactNode } from "react";

/** A Y2K window frame. Used to wrap every scene. */
export function Bezel({
  title,
  status,
  children,
  className = "",
}: {
  title: string;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bezel relative overflow-hidden ${className}`}>
      <div className="bezel-strip flex items-center justify-between px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-arkiv-orange border border-ink" />
          <span className="inline-block h-3 w-3 rounded-full bg-stone border border-ink" />
          <span className="inline-block h-3 w-3 rounded-full bg-stone border border-ink" />
          <span className="ml-2 tracking-widest">{title}</span>
        </div>
        <div className="font-mono text-[10px] opacity-70">{status}</div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

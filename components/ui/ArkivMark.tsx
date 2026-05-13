/** Brand wordmark — text only, lockup style. */
export function ArkivMark({ tone = "ink" }: { tone?: "ink" | "sand" }) {
  const color = tone === "ink" ? "#111111" : "#F6F4EF";
  return (
    <span
      className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.3em]"
      style={{ color }}
    >
      <span aria-hidden>[</span>
      <span>ARKIV</span>
      <span aria-hidden>]</span>
    </span>
  );
}

export type DataTypeKey = "pulse" | "cache" | "stacks";

export interface DataType {
  key: DataTypeKey;
  name: string;
  subtitle: string;
  oneLiner: string;
  ttlLabel: string;
  ttlSeconds: number;
  vibe: string;
  swatch: { bg: string; ink: string; accent: string };
  mood: string;
  trendsWith: string;
}

export interface ChatTurn {
  role: "agent" | "user";
  content: string;
  /** ms since epoch when the turn was produced */
  createdAt: number;
  /** for user turns: latency from the previous agent message in ms */
  latencyMs?: number;
}

/** Phase of the 4-minute game loop. */
export type Phase = "boot" | "connect" | "chat" | "seal" | "reveal" | "aftermath";

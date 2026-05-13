/**
 * Server-only Arkiv wallet client.
 *
 * - When ARKIV_PRIVATE_KEY is set, performs real on-chain writes to Braga.
 * - When unset, synthesises an entity locally so the game still runs in dev
 *   and on Vercel previews without a wallet attached.
 *
 * NEVER import this from a client component — it pulls in the Arkiv SDK and
 * (in chain mode) reads the private key from process.env.
 */

import "server-only";
import {
  createWalletClient,
  http,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";
import { jsonToPayload, ExpirationTime } from "@arkiv-network/sdk/utils";

import type { DataTypeKey } from "./types";
import {
  PROJECT_ATTRIBUTE,
  freshnessFor,
  ttlForFreshness,
  type Freshness,
  type Entity,
} from "./arkiv-store";

const PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY ?? process.env.PRIVATE_KEY;

let cachedWallet: ReturnType<typeof createWalletClient> | null = null;
function wallet() {
  if (!PRIVATE_KEY) return null;
  if (cachedWallet) return cachedWallet;
  const account = privateKeyToAccount(
    (PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`) as `0x${string}`,
  );
  cachedWallet = createWalletClient({
    chain: braga,
    transport: http(),
    account,
  });
  return cachedWallet;
}

export function chainEnabled(): boolean {
  return !!PRIVATE_KEY;
}

export function walletAddress(): string | null {
  if (!PRIVATE_KEY) return null;
  const account = privateKeyToAccount(
    (PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`) as `0x${string}`,
  );
  return account.address;
}

let synthCounter = 0;
function synthKey(prefix: string) {
  synthCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${synthCounter.toString(36)}`;
}

export interface ChainEntity extends Entity {
  freshness?: Freshness;
  txHash?: string;
  onChain: boolean;
}

/**
 * Write a chat reply to the archive. Returns immediately with a synthesised
 * entity when no wallet is configured; otherwise issues the create on Braga
 * and returns the real entityKey + txHash.
 */
export async function writeReplyEntity(opts: {
  text: string;
  character: DataTypeKey;
  latencyMs: number | null;
}): Promise<ChainEntity> {
  const freshness = freshnessFor(opts.latencyMs);
  const expiresIn = ttlForFreshness(freshness);
  const createdAt = Date.now();
  const attributes = [
    PROJECT_ATTRIBUTE,
    { key: "entityType", value: "reply" },
    { key: "character", value: opts.character },
    { key: "latencyMs", value: opts.latencyMs ?? 0 },
    { key: "length", value: opts.text.length },
    { key: "freshness", value: freshness },
    { key: "createdAt", value: createdAt },
  ];

  const w = wallet();
  if (!w) {
    return {
      entityKey: synthKey("reply"),
      payload: { text: opts.text },
      contentType: "text/plain",
      attributes,
      expiresIn,
      createdAt,
      freshness,
      onChain: false,
    };
  }

  try {
    const { entityKey, txHash } = await w.createEntity({
      payload: jsonToPayload({ text: opts.text }),
      contentType: "text/plain",
      attributes,
      expiresIn,
    });
    return {
      entityKey,
      payload: { text: opts.text },
      contentType: "text/plain",
      attributes,
      expiresIn,
      createdAt,
      freshness,
      txHash,
      onChain: true,
    };
  } catch (err) {
    console.error("[arkiv] reply write failed, returning synthetic entity:", err);
    return {
      entityKey: synthKey("reply"),
      payload: { text: opts.text },
      contentType: "text/plain",
      attributes,
      expiresIn,
      createdAt,
      freshness,
      onChain: false,
    };
  }
}

/**
 * Persist the final data-type result. Longer TTL than chat replies — this
 * is the entity that "lives in the archive after the chat is gone".
 */
export async function writeDataTypeEntity(opts: {
  type: DataTypeKey;
  arcadeScore: number;
}): Promise<ChainEntity> {
  // The data-type entity gets a much longer life than chat replies, but we
  // cap it at 30 days to keep storage fees sane. Per Arkiv best practice:
  // start short, extend if needed.
  const expiresIn = ExpirationTime.fromDays(30);
  const createdAt = Date.now();
  const attributes = [
    PROJECT_ATTRIBUTE,
    { key: "entityType", value: "dataType" },
    { key: "type", value: opts.type },
    { key: "arcadeScore", value: opts.arcadeScore },
    { key: "createdAt", value: createdAt },
  ];
  const payload = { type: opts.type, arcadeScore: opts.arcadeScore };

  const w = wallet();
  if (!w) {
    return {
      entityKey: synthKey("datatype"),
      payload,
      contentType: "application/json",
      attributes,
      expiresIn,
      createdAt,
      onChain: false,
    };
  }

  try {
    const { entityKey, txHash } = await w.createEntity({
      payload: jsonToPayload(payload),
      contentType: "application/json",
      attributes,
      expiresIn,
    });
    return {
      entityKey,
      payload,
      contentType: "application/json",
      attributes,
      expiresIn,
      createdAt,
      txHash,
      onChain: true,
    };
  } catch (err) {
    console.error("[arkiv] datatype write failed, returning synthetic entity:", err);
    return {
      entityKey: synthKey("datatype"),
      payload,
      contentType: "application/json",
      attributes,
      expiresIn,
      createdAt,
      onChain: false,
    };
  }
}

/** Braga explorer link for a tx hash, used in UI chips. */
export function explorerTxUrl(txHash: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`;
}

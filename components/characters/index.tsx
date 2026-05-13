import type { DataTypeKey } from "@/lib/types";
import { Pulse } from "./Pulse";
import { Flux } from "./Flux";
import { Cache } from "./Cache";
import { Stacks } from "./Stacks";

export { Pulse, Flux, Cache, Stacks };

export function CharacterSprite({
  type,
  size = 200,
}: {
  type: DataTypeKey;
  size?: number;
}) {
  switch (type) {
    case "pulse":
      return <Pulse size={size} />;
    case "flux":
      return <Flux size={size} />;
    case "cache":
      return <Cache size={size} />;
    case "stacks":
      return <Stacks size={size} />;
  }
}

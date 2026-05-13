import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { ArkivMark } from "@/components/ui/ArkivMark";
import { Bezel } from "@/components/ui/Bezel";
import Link from "next/link";

export const metadata = {
  title: "Leaderboard · Data Type Game",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const params = await searchParams;
  const name = params?.name ?? "";
  return (
    <main className="min-h-screen bg-sand">
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <header className="mb-4 flex items-center justify-between">
          <ArkivMark />
          <Link
            href="/"
            className="font-mono text-[10px] tracking-widest opacity-60 hover:opacity-100"
          >
            ← BACK TO GAME
          </Link>
        </header>
        <Bezel title="ARKIV · LEADERBOARD" status="extending top-5 live">
          <div className="crt relative min-h-[560px] bg-sand p-6">
            <h1 className="mb-2 font-mono text-3xl">Who answered fastest</h1>
            <p className="mb-6 max-w-prose text-sm opacity-70">
              Every row here is a real Arkiv entity on the Braga testnet. Fast
              players win a longer TTL up front, and the top 5 get their TTL
              extended on-chain every 45 seconds (you'll see <code>EXT</code>
              tags flash when an <code>extendEntity</code> tx confirms). Once
              you fall out of the top 5, the network forgets you on its own.
            </p>
            <Leaderboard highlightName={name} />
          </div>
        </Bezel>
        <footer className="mt-6 flex items-center justify-between font-mono text-[10px] opacity-60">
          <span>arkiv-shaped entities · readLeaderboard via publicClient</span>
          <span>brand · arkiv.network</span>
        </footer>
      </div>
    </main>
  );
}

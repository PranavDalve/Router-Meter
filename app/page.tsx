// app/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DotGrid from "../components/DotGrid";  // ← Updated import (shadcn style)

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#0f0b1a] overflow-hidden">
      {/* Background animation layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DotGrid
          dotSize={5}
          gap={15}
          baseColor="#271E37"
          activeColor="#e07800"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
          style={{}}
        />
      </div>

      {/* Hero section – now sits above background */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-white">
            Indirex Router Meter
          </h1>
          <p className="text-xl text-zinc-300">
            Monitor, manage and optimize your home or office network
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer – also above background */}
      <footer className="relative z-10 border-t border-zinc-800 py-6 text-center text-sm text-zinc-500 bg-black/30 backdrop-blur-sm">
        © {new Date().getFullYear()} Router Meter. All rights reserved.
      </footer>
    </div>
  );
}
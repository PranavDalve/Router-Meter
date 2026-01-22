// app/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Indirex Router Meter
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor, manage and optimize your home or office network
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Router Meter. All rights reserved.
      </footer>
    </div>
  );
}
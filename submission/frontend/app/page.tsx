"use client";

import { Header } from "@/components/header";
import { BountyBoard } from "@/components/bounty-board";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <BountyBoard />
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>BountyMove — Built on Movement Network · Open Claw Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}

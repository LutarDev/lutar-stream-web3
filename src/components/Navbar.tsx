"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text">
            MirrorPlay
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/broadcast">
              <Button variant="outline">Go Live</Button>
            </Link>
            
            <ConnectButton client={thirdwebClient} />
          </div>
        </div>
      </div>
    </nav>
  );
}

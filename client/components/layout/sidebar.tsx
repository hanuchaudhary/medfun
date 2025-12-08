"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  TrendingUp,
  Zap,
  User,
  HelpCircle,
  MoreVertical,
  Plus,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Livestreams", href: "/live", icon: Zap, locked: true },
  { name: "Terminal", href: "/coins", icon: TrendingUp, locked: true },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Support", href: "/support", icon: Headphones, locked: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 bg-background border-r border-border flex-col">
      <Link href="/" className="flex items-center justify-center py-6 px-4">
        <div className="relative w-12 h-12">
          <Image
            src="/medfun-favicon.png"
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </Link>

      <nav className="flex-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <button
                disabled={item.locked}
                className={cn(
                  "flex w-full items-center gap-2.5 py-2 px-4 rounded-sm transition-colors text-xs font-medium text-md mb-2",
                  isActive
                    ? "bg-primary text-background"
                    : "hover:text-foreground hover:bg-accent"
                  , item.locked && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            </Link>
          );
        })}

        <button className="flex items-center gap-4 py-3 px-4 rounded-lg transition-colors font-medium text-md text-muted-foreground hover:text-foreground hover:bg-accent w-full">
          <MoreVertical className="h-5 w-5" />
          More
        </button>
      </nav>

      <div className="p-3 pb-4">
        <Link href="/create">
          <Button className="w-full rounded-lg bg-primary hover:bg-primary/90 text-background font-semibold py-6">
            <Plus className="h-5 w-5" />
            Create coin
          </Button>
        </Link>

        {connected && (
          <div className="mt-3 text-center">
            <div className="text-xs mb-1 flex items-center justify-center gap-1">
              Creator rewards
            </div>
            <div className="text-sm font-bold text-foreground">$0.04</div>
          </div>
        )}
      </div>
    </aside>
  );
}

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
  { name: "Livestreams", href: "/live", icon: Zap },
  { name: "Terminal", href: "/tokens", icon: TrendingUp },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Support", href: "/support", icon: Headphones },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-40 bg-background border-r border-border flex flex-col">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center py-6 px-4">
        <div className="relative w-12 h-12">
          <Image
            src="/logo.jpg"
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-colors text-xs font-medium",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-colors text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full"
        >
          <MoreVertical className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Create Coin Button */}
      <div className="p-3 pb-6">
        <Link href="/create">
          <Button
            className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-1" />
            Create coin
          </Button>
        </Link>

        {/* Creator Rewards */}
        {connected && (
          <div className="mt-4 text-center">
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              Creator rewards
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded">
                New
              </span>
            </div>
            <div className="text-sm font-bold text-foreground">$0.04</div>
          </div>
        )}
      </div>
    </aside>
  );
}

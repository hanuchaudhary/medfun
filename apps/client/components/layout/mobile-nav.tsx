"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Zap, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Live", href: "/live", icon: Zap },
  { name: "Create", href: "/create", icon: Plus, highlight: true },
  { name: "Terminal", href: "/terminal", icon: TrendingUp },
  { name: "Profile", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium",
                item.highlight
                  ? "text-primary"
                  : isActive
                  ? "text-primary bg-accent"
                  : "text-muted-foreground active:bg-accent"
              )}
            >
              <Icon className={cn("h-5 w-5", item.highlight && "h-6 w-6")} />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

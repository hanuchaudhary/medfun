import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Token } from "@/types/token";

interface TokenCardProps {
  token: Token;
  href: string;
}

export function TokenCard({ token, href }: TokenCardProps) {
  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "$0";
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    for (const interval in intervals) {
      const intervalSeconds = intervals[interval];
      if (diffInSeconds >= intervalSeconds!) {
        const count = Math.floor(diffInSeconds / intervalSeconds!);
        return `${count} ${interval}${count !== 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  };

  const progress = token.bondingCurveProgress ?? 0;

  return (
    <Link href={href}>
      <div className="flex gap-3 rounded-lg transition-all cursor-pointer group">
        <div className="relative w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            unoptimized
            src={
              token.imageUrl ||
              "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg"
            }
            alt={token.name || "Token"}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold text-sm truncate uppercase">
                {token.name}
              </h3>
              <Badge
                variant="secondary"
                className="text-xs text-primary rounded-md flex-shrink-0"
              >
                {token.symbol}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {token.description}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="font-semibold text-xs">
                {formatNumber(token.marketCap)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-semibold text-xs">
                {formatTimeAgo(token.createdAt!)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bonding Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress+10} className="" />
          </div>
        </div>
      </div>
    </Link>
  );
}

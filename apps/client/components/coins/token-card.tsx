import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Token } from "@/types/token";
import { formatNumber, getTimeSince } from "@/lib/utils";
import { IconVideoFilled } from "@tabler/icons-react";

interface TokenCardProps {
  token: Token;
  href: string;
}

export function TokenCard({ token, href }: TokenCardProps) {
  const progress = token.graduatedPoolAddress ? 100 : token.bondingCurveProgress ?? 0;

  return (
    <Link href={href}>
      <div className="flex gap-3 rounded-lg transition-all cursor-pointer group hover:scale-[1.03]">
        <div className="relative w-40 h-40 shrink-0 rounded-lg overflow-hidden">
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
          {token.isStreamLive && (
            <div className="absolute top-2 left-2 z-10">
              <IconVideoFilled className="text-primary animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold text-sm truncate uppercase">
                {token.name}
              </h3>
              <Badge
                variant="secondary"
                className="text-xs text-primary rounded-md shrink-0"
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
                {getTimeSince(token.createdAt!)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bonding Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <Progress
              isGraduated={progress >= 100}
              value={progress}
              className="border border-solid rounded border-primary/50"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

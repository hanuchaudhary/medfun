"use server";

export type TokenCardItem = {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  marketCap: string;
  volume: string;
  progress: number;
  createdAt: string;
  publicKey: string | { toString(): string };
  poolKey: string | { toString(): string };
  quoteMint: string | { toString(): string };
  tokenReserve: string;
  quoteReserve: string;
  tokenMint?: string | { toString(): string };
};

export interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  dev: string;
  circSupply: number;
  totalSupply: number;
  tokenProgram: string;
  launchpad: string;
  metaLaunchpad: string;
  firstPool: {
    id: string;
    createdAt: string;
  };
  holderCount: number;
  audit: {
    mintAuthorityDisabled: boolean;
    freezeAuthorityDisabled: boolean;
    topHoldersPercentage: number;
    devBalancePercentage: number;
  };
  organicScore: number;
  organicScoreLabel: string;
  tags: string[];
  fdv: number;
  mcap: number;
  usdPrice: number;
  priceBlockId: number;
  liquidity: number;
  bondingCurve: number;
  updatedAt: string;
}


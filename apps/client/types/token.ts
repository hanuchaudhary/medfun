export interface Token {
  id?: number;
  name: string;
  symbol: string;
  description: string | null;
  mintAddress: string;
  poolAddress: string;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  imageUrl: string | null;
  metadataUrl: string | null;
  creatorAddress: string;
  bondingCurveProgress: number | null;
  volume: number | null;
  liquidity: number | null;
  marketCap: number | null;
  holderCount: number | null;
  stats5m: TokenStats | null;
  stats1h: TokenStats | null;
  stats6h: TokenStats | null;
  stats24h: TokenStats | null;

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TokenStats {
  priceChange: number | null;
  holderChange: number | null;
  liquidityChange: number | null;
  volumeChange: number | null;
  buyVolume: number | null;
  sellVolume: number | null;
  buyOrganicVolume: number | null;
  sellOrganicVolume: number | null;
  numBuys: number | null;
  numSells: number | null;
  numTraders: number | null;
  numNetBuyers: number | null;
}

export interface SocialLinks {
  twitter: string;
  telegram: string;
  website: string;
}

export interface TokenFormData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  socialLinks: SocialLinks;
}

export interface Kline {
  id?: number;
  tokenId: number;
  time: Date | string;
  netVolume: number;
}

export interface Holder {
  id: number;
  address: string;
  amount: number;
  solBalance: string;
  solBalanceDisplay: number;
  tags: any;
  tokenId: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Trade {
  id: number;
  asset: string;
  type: string;
  usdPrice: number;
  usdVolume: number;
  traderAddress: string;
  txHash: string;
  amount: number;
  isMev: boolean;
  isValidPrice: boolean;
  isValidPosition: boolean;
  poolId: string;
  nativeVolume: number;
  timestamp: Date | string;
  tokenId: number;
}

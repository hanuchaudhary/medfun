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

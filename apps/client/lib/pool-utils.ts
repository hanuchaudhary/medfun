export interface PoolAccountData {
  publicKey: string;
  account: {
    volatilityTracker: {
      lastUpdateTimestamp: string;
      padding: number[];
      sqrtPriceReference: string;
      volatilityAccumulator: string;
      volatilityReference: string;
    };
    config: string;
    creator: string;
    baseMint: string;
    baseVault: string;
    quoteVault: string;
    baseReserve: string;
    quoteReserve: string;
    protocolBaseFee: string;
    protocolQuoteFee: string;
    partnerBaseFee: string;
    partnerQuoteFee: string;
    sqrtPrice: string;
    activationPoint: string;
    poolType: number;
    isMigrated: number;
    isPartnerWithdrawSurplus: number;
    isProtocolWithdrawSurplus: number;
    migrationProgress: number;
    isWithdrawLeftover: number;
    isCreatorWithdrawSurplus: number;
    migrationFeeWithdrawStatus: number;
    metrics: {
      totalProtocolBaseFee: string;
      totalProtocolQuoteFee: string;
      totalTradingBaseFee: string;
      totalTradingQuoteFee: string;
    };
    finishCurveTimestamp: string;
    creatorBaseFee: string;
    creatorQuoteFee: string;
    padding1: string[];
  };
}
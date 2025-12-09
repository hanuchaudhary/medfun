"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "sonner";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  useSignTransaction as useSignTransactionSolana,
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import {
  DynamicBondingCurveClient,
  DAMM_V2_MIGRATION_FEE_ADDRESS,
  deriveDammV2MigrationMetadataAddress,
  deriveBaseKeyForLocker,
  deriveEscrow,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { BN } from "bn.js";
import { POOL_CONFIG_KEY, TOKEN_POOL_ADDRESS } from "@/app/constant";
import PoolState from "./pool-state";

interface MigrationCardProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  poolAddress: string;
  configAddress: string;
}

export function MigrationCard({
  tokenId,
  tokenName,
  tokenSymbol,
  poolAddress,
  configAddress,
}: MigrationCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationStep, setMigrationStep] = useState("");
  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signTransaction: signTransactionSolana } = useSignTransactionSolana();
  const { signAndSendTransaction: sendTransactionSolana } = useSendTransactionSolana();

  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

  const connection = new Connection(RPC_URL, "confirmed");
  const client = new DynamicBondingCurveClient(connection, "confirmed");

  const getPrivyWallet = () => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
  };

  React.useEffect(() => {
    let isMounted = true;
    const checkIsMigrated = async () => {
      try {
        const vps = await client.state.getPool(TOKEN_POOL_ADDRESS);
        if (isMounted && vps?.isMigrated) {
          setMigrationComplete(true);
        }
      } catch (err) {
        console.error("Failed to load pool state:", err);
      }
    };
    checkIsMigrated();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMigrate = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return;
    }

    setIsMigrating(true);

    try {
      const poolPubkey = TOKEN_POOL_ADDRESS;
      const configPubkey = POOL_CONFIG_KEY;
      const virtualPoolState = await client.state.getPool(poolPubkey);
      const poolConfigState = await client.state.getPoolConfig(configPubkey);

      toast.info("Fetching pool state...", {
        description: "Loading pool information",
      });
      setMigrationStep("Fetching pool state...");

      if (!virtualPoolState) {
        throw new Error("Pool not found");
      }

      if (virtualPoolState.isMigrated) {
        toast.warning("Pool already migrated");
        setMigrationComplete(true);
        return;
      }

      setMigrationStep("Checking migration metadata...");
      const migrationMetadata =
        deriveDammV2MigrationMetadataAddress(poolPubkey);
      const metadataAccount = await connection.getAccountInfo(
        migrationMetadata
      );

      if (!metadataAccount) {
        toast.info("Creating migration metadata...", {
          description: "Step 1 of 3",
        });
        setMigrationStep("Creating migration metadata...");

        const createMetadataTx =
          await client.migration.createDammV1MigrationMetadata({
            payer: wallet.publicKey,
            virtualPool: poolPubkey,
            config: configPubkey,
          });

        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        createMetadataTx.recentBlockhash = blockhash;
        createMetadataTx.feePayer = wallet.publicKey;

        const signedTxBase64 = createMetadataTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
        const signedMetadataTxResult = await sendTransactionSolana({
          transaction: Buffer.from(signedTxBase64, "base64"),
          wallet: privyWallet,
        });
        const metadataSignature = signedMetadataTxResult.signature;

        toast.success("Migration metadata created!", {
          description: `Transaction: ${metadataSignature.slice(0, 8)}...`,
        });
      }

      if (
        poolConfigState.lockedVestingConfig.amountPerPeriod.gt(new BN(0)) ||
        poolConfigState.lockedVestingConfig.cliffUnlockAmount.gt(new BN(0))
      ) {
        const base = deriveBaseKeyForLocker(poolPubkey);
        const escrow = deriveEscrow(base);
        const escrowAccount = await connection.getAccountInfo(escrow);

        if (!escrowAccount) {
          toast.info("Creating locker...", {
            description: "Step 2 of 3",
          });
          setMigrationStep("Creating locker...");

          const createLockerTx = await client.migration.createLocker({
            virtualPool: poolPubkey,
            payer: wallet.publicKey,
          });

          const { blockhash: lockerBlockhash } =
            await connection.getLatestBlockhash("confirmed");
          createLockerTx.recentBlockhash = lockerBlockhash;
          createLockerTx.feePayer = wallet.publicKey;

          const lockerTxBase64 = createLockerTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
          const signedLockerTxResult = await sendTransactionSolana({
            transaction: Buffer.from(lockerTxBase64, "base64"),
            wallet: privyWallet,
          });
          const lockerSignature = signedLockerTxResult.signature;

          toast.success("Locker created!", {
            description: `Transaction: ${lockerSignature.slice(0, 8)}...`,
          });
        }
      }

      toast.info("Migrating to DAMM V2...", {
        description: "Final step - Please approve in wallet",
      });
      setMigrationStep("Migrating to DAMM V2...");

      const migrateTx = await client.migration.migrateToDammV2({
        payer: wallet.publicKey,
        virtualPool: poolPubkey,
        dammConfig:
          DAMM_V2_MIGRATION_FEE_ADDRESS[poolConfigState.migrationFeeOption]!
      });

      const { blockhash: migrateBlockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      console.log("Migration transaction:", migrateTx);

      migrateTx.transaction.recentBlockhash = migrateBlockhash;
      migrateTx.transaction.lastValidBlockHeight = lastValidBlockHeight;
      migrateTx.transaction.feePayer = wallet.publicKey;

      console.log("Signing migration transaction with NFT keypairs...");

      migrateTx.transaction.sign(
        migrateTx.firstPositionNftKeypair,
        migrateTx.secondPositionNftKeypair
      );
      console.log("NFT keypairs signed successfully");

      console.log("Requesting wallet signature...");
      const migrateTxBase64 = migrateTx.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
      const signedMigrateTxResult = await sendTransactionSolana({
        transaction: Buffer.from(migrateTxBase64, "base64"),
        wallet: privyWallet,
      });
      const migrateSignature = signedMigrateTxResult.signature;
      console.log("Wallet signed successfully");

      toast.success("Migration transaction submitted!", {
        description: `Transaction: ${migrateSignature.slice(0, 8)}...`,
      });

      setMigrationComplete(true);
      setMigrationStep("Migration complete!");

      toast.success("Migration completed successfully!", {
        description: `Your token has been migrated to DAMM V2`,
        duration: 10000,
        action: {
          label: "View on Solscan",
          onClick: () =>
            window.open(
              `https://solscan.io/tx/${migrateSignature}?cluster=devnet`,
              "_blank"
            ),
        },
      });
    } catch (error) {
      console.log("Migration error:", error);
      toast.error("Migration failed", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsMigrating(false);
      setMigrationStep("");
    }
  };

  React.useEffect(() => {
    if (migrationComplete) {
      setMigrationComplete(true);
    }
  }, [migrationComplete]);

  const handleCloseDialog = () => {
    setShowDialog(false);
    if (migrationComplete) {
      setMigrationComplete(false);
    }
  };

  return (
    <>
      <Card className="border-b gap-5.5 border-x-0 p-0 rounded-none pt-5 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Ready for Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Congratulations! This token has reached 100% bonding curve progress
            and is now eligible for migration to DAMM V2.
          </p>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Migration will transfer liquidity to DAMM V2 pool. This action is
              irreversible and requires multiple transaction approvals.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="p-0 grid grid-cols-2">
          <Button
            onClick={() => setShowDialog(true)}
            className="w-full rounded-none py-8 border-r"
            size="lg"
            disabled={migrationComplete}
          >
            {migrationComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Migration Complete
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Migrate to DAMM V2
              </>
            )}
          </Button>
          {migrationComplete && <PoolState />}
        </CardFooter>
      </Card>

      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg bg-transparent rounded-[32px] backdrop-blur-sm border border-primary/10 p-2">
          <div className="p-6 rounded-3xl border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Confirm Migration
              </DialogTitle>
              <DialogDescription>
                You are about to migrate {tokenName} ({tokenSymbol}) to DAMM V2
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> This action cannot be undone. The
                  migration will:
                </AlertDescription>
              </Alert>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Create migration metadata (if needed)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Create locker for vesting (if configured)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Migrate liquidity to DAMM V2 pool</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Require multiple transaction approvals</span>
                </li>
              </ul>

              {migrationStep && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">{migrationStep}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isMigrating}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="w-full sm:w-auto"
              >
                {isMigrating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Migrating...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Confirm Migration
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

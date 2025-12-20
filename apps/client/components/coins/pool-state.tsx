import {
  DAMM_V2_MIGRATION_FEE_ADDRESS,
  deriveDammV2PoolAddress,
  DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import React from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { updateGraduatedPoolAddress } from "@/lib/actions";

export default function PoolState({
  TOKEN_MINT_ADDRESS,
  TOKEN_POOL_ADDRESS,
  currentGraduatedPool,
}: {
  TOKEN_MINT_ADDRESS: PublicKey;
  TOKEN_POOL_ADDRESS: PublicKey;
  currentGraduatedPool?: string | null;
}) {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL!,
    "confirmed"
  );

  const client = new DynamicBondingCurveClient(connection, "confirmed");
  const POOL_ADDRESS = TOKEN_POOL_ADDRESS;
  async function handlePoolState() {
    try {
      const poolState = await client.state.getPool(POOL_ADDRESS);
      if (!poolState) {
        console.error("Pool doesn't exist yet!");
      }

      const virtualPoolState = await client.state.getPool(POOL_ADDRESS);
      if (!virtualPoolState) {
        throw new Error("Pool not found");
      }

      const poolConfigState = await client.state.getPoolConfig(
        virtualPoolState.config
      );
      const dammV2PoolAddress = deriveDammV2PoolAddress(
        DAMM_V2_MIGRATION_FEE_ADDRESS[poolConfigState.migrationFeeOption]!,
        TOKEN_MINT_ADDRESS,
        new PublicKey("So11111111111111111111111111111111111111112") // token program
      );

      const derivedPoolAddressStr = dammV2PoolAddress.toString();
      console.log("Damm V2 Pool Address:", derivedPoolAddressStr);

      // Check if derived pool differs from current graduated pool in DB
      if (derivedPoolAddressStr !== currentGraduatedPool) {
        console.log("Graduated pool mismatch! Updating DB...");
        console.log("Current in DB:", currentGraduatedPool);
        console.log("Derived:", derivedPoolAddressStr);

        // Update the graduated pool address in DB
        const result = await updateGraduatedPoolAddress(
          TOKEN_MINT_ADDRESS.toString(),
          derivedPoolAddressStr
        );

        if (result.success) {
          toast.success("Graduated pool address updated in database!");
        } else {
          toast.error("Failed to update graduated pool address");
          console.error("Update error:", result.error);
        }
      } else {
        toast.success("Pool state is up to date!");
      }

      toast.success(`Damm V2 Pool Address: ${derivedPoolAddressStr}`);

      const dammV2PoolState = await client.state.getPool(dammV2PoolAddress);
      if (!dammV2PoolState) {
        console.error("Damm V2 Pool doesn't exist yet!");
      } else {
        console.log("Damm V2 Pool State:", dammV2PoolState);
      }
    } catch (error) {
      console.error("Error occurred during swap:", error);
      // toast.error("Error occurred during swap");
    }
  }
  return (
    <Button
      onClick={() => handlePoolState()}
      className="w-full rounded-none py-8"
    >
      Get Pool State
    </Button>
  );
}

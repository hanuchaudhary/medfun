import axios from "axios";

export function generateUidFromPublicKey(publicKey: string): number {
  let hash = 0;
  for (let i = 0; i < publicKey.length; i++) {
    const char = publicKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2147483647;
}

export async function generateToken(
  roleNum: number,
  setLoadingMessage: (message: string) => void,
  publicKey: string | null,
  channelId: string
): Promise<string | null> {
  try {
    setLoadingMessage("Generating token...");

    if (!publicKey) {
      throw new Error("Wallet not connected");
    }

    const uid = generateUidFromPublicKey(publicKey);
    const response = await axios.post("/api/live", {
      channelName: channelId,
      uid: uid,
      role: roleNum,
    });

    const data = await response.data;
    return data.token;
  } catch (error) {
    console.error("Error generating token:", error);
    setLoadingMessage("Failed to generate token");
    return null;
  }
}

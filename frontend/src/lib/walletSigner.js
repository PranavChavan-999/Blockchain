import { BrowserProvider } from "ethers";
import { ensureProviderAccounts } from "./walletReady";

/**
 * Returns an ethers signer only after the connector provider has authorized accounts.
 */
export async function getAuthorizedEthersSigner(connector, expectedAddress) {
  if (!connector) {
    throw new Error("Wallet connector not available — connect via ConnectKit first");
  }

  await ensureProviderAccounts(connector);
  const provider = await connector.getProvider();

  const browserProvider = new BrowserProvider(provider);
  const signer = expectedAddress
    ? await browserProvider.getSigner(expectedAddress)
    : await browserProvider.getSigner();

  return signer;
}

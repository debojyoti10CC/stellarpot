import { Keypair, Horizon, TransactionBuilder, Networks, Asset, Operation } from '@stellar/stellar-sdk'

const server = new Horizon.Server('https://horizon-testnet.stellar.org')

export async function createEscrowAccount() {
  const pair = Keypair.random();
  console.log('Generating new escrow:', pair.publicKey());
  
  try {
    console.log('Funding Escrow via Friendbot...');
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`
    );
    const responseJSON = await response.json();
    if (!response.ok) {
      console.error("Friendbot error", responseJSON);
    }
  } catch (e) {
    console.error("Friendbot fetch error", e);
  }
  
  return {
    publicKey: pair.publicKey(),
    secret: pair.secret(),
  }
}

export async function executePayout(escrowSecret: string, winners: { address: string, amount: number }[]) {
  const escrowKeypair = Keypair.fromSecret(escrowSecret);
  
  try {
    const account = await server.loadAccount(escrowKeypair.publicKey());
    
    let builder = new TransactionBuilder(account, {
      fee: (100 * winners.length * 2).toString(), // Overestimating fee
      networkPassphrase: Networks.TESTNET
    });
    
    for (const winner of winners) {
      builder = builder.addOperation(
        Operation.payment({
          destination: winner.address,
          asset: Asset.native(),
          amount: winner.amount.toFixed(7) // Stellar amount formatting
        })
      );
    }
    
    const tx = builder.setTimeout(60).build();
    tx.sign(escrowKeypair);
    
    const txResult = await server.submitTransaction(tx);
    return { success: true, hash: txResult.hash };
  } catch (e: any) {
    console.error('Payout check failed:', e?.response?.data || e);
    return { success: false, error: e };
  }
}

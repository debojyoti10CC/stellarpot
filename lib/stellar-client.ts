import { TransactionBuilder, Networks, Asset, Operation, Horizon, Transaction, Keypair } from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

export async function submitDepositTransaction(userPublicKey: string, escrowAddress: string, amount: number): Promise<string> {
  console.log('Submitting deposit of', amount, 'to', escrowAddress);
  const account = await server.loadAccount(userPublicKey);
  
  const tx = new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(Operation.payment({
    destination: escrowAddress,
    asset: Asset.native(),
    amount: amount.toFixed(7)
  }))
  .setTimeout(60)
  .build();
  
  const xdr = tx.toXDR();
  console.log('Requesting Signature...');
  
  // Freighter flow
  const freighter = await import('@stellar/freighter-api');
  const signedTxResult = await freighter.signTransaction(xdr, { networkPassphrase: Networks.TESTNET }) as any;
  
  if (signedTxResult.error) {
     throw new Error(signedTxResult.error);
  }
  
  const signedTxXdr = typeof signedTxResult === 'string' ? signedTxResult : signedTxResult.signedTxXdr || signedTxResult;
  
  console.log('Submitting to horizon...');
  
  const signedTxObj = new Transaction(signedTxXdr, Networks.TESTNET);
  const result = await server.submitTransaction(signedTxObj);
  
  return result.hash;
}

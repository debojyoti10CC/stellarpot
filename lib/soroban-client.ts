// ═══════════════════════════════════════════════════════════
//  SOROBAN CONTRACT CLIENT
//  All interactions go directly to the deployed smart contract.
//  No server-side secrets. No custodial anything.
//  The contract itself holds and distributes funds.
// ═══════════════════════════════════════════════════════════

import * as StellarSdk from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CC5CLW64G7B2HY2PHIQWEETUON5LGKXTIDXS2K5HU4OVHUEAJEYEWT4N';
const NATIVE_XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export { CONTRACT_ID, NATIVE_XLM_SAC };

const server = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────

async function signAndSubmit(txXdr: string): Promise<string> {
  const freighter = await import('@stellar/freighter-api');

  const signResult = await freighter.signTransaction(txXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  }) as any;

  if (signResult.error) {
    throw new Error(typeof signResult.error === 'string' ? signResult.error : JSON.stringify(signResult.error));
  }

  const signedXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResponse = await server.sendTransaction(tx);

  if (sendResponse.status === 'ERROR') {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResponse)}`);
  }

  // Poll for completion
  let getResponse = await server.getTransaction(sendResponse.hash);
  while (getResponse.status === 'NOT_FOUND') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    getResponse = await server.getTransaction(sendResponse.hash);
  }

  if (getResponse.status === 'SUCCESS') {
    return sendResponse.hash;
  } else {
    throw new Error(`Transaction failed: ${getResponse.status}`);
  }
}

async function buildContractCall(
  callerPublicKey: string,
  method: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<string> {
  const account = await server.getAccount(callerPublicKey);

  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '10000000', // 1 XLM max fee (Soroban transactions need higher fees)
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    const errMsg = (simulated as any).error || 'Simulation failed';
    throw new Error(`Simulation error: ${errMsg}`);
  }

  const prepared = StellarSdk.rpc.assembleTransaction(tx, simulated).build();
  return prepared.toXDR();
}

// Read-only call (no signing required)
async function readContract(
  method: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | undefined> {
  const account = new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');

  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    return undefined;
  }

  const result = (simulated as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse).result;
  return result?.retval;
}

// ─────────────────────────────────────────
//  CONTRACT INTERFACE
// ─────────────────────────────────────────

export async function createRoom(
  creatorPublicKey: string,
  description: string,
  options: string[],
  stakeAmountXLM: number,
  expiryLedgers: number = 17280, // ~24 hours (5s per ledger)
): Promise<number> {
  const args = [
    StellarSdk.nativeToScVal(creatorPublicKey, { type: 'address' }),
    StellarSdk.nativeToScVal(NATIVE_XLM_SAC, { type: 'address' }),
    StellarSdk.nativeToScVal(description, { type: 'string' }),
    StellarSdk.nativeToScVal(options, { type: 'string' }),
    StellarSdk.nativeToScVal(BigInt(Math.round(stakeAmountXLM * 10_000_000)), { type: 'i128' }),
    StellarSdk.nativeToScVal(expiryLedgers, { type: 'u32' }),
  ];

  const txXdr = await buildContractCall(creatorPublicKey, 'create_room', args);
  const hash = await signAndSubmit(txXdr);
  console.log('Room creation tx:', hash);

  // Read room count to get the new room ID
  const countVal = await readContract('get_room_count', []);
  if (countVal) {
    return Number(StellarSdk.scValToNative(countVal));
  }
  return 1;
}

export async function placeBet(
  bettorPublicKey: string,
  roomId: number,
  optionIdx: number,
): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(bettorPublicKey, { type: 'address' }),
    StellarSdk.nativeToScVal(BigInt(roomId), { type: 'u64' }),
    StellarSdk.nativeToScVal(optionIdx, { type: 'u32' }),
  ];

  const txXdr = await buildContractCall(bettorPublicKey, 'place_bet', args);
  return await signAndSubmit(txXdr);
}

export async function resolveRoom(
  callerPublicKey: string,
  roomId: number,
  winningOptionIdx: number,
): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(callerPublicKey, { type: 'address' }),
    StellarSdk.nativeToScVal(BigInt(roomId), { type: 'u64' }),
    StellarSdk.nativeToScVal(winningOptionIdx, { type: 'u32' }),
  ];

  const txXdr = await buildContractCall(callerPublicKey, 'resolve', args);
  return await signAndSubmit(txXdr);
}

export async function cancelRoom(
  callerPublicKey: string,
  roomId: number,
): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(callerPublicKey, { type: 'address' }),
    StellarSdk.nativeToScVal(BigInt(roomId), { type: 'u64' }),
  ];

  const txXdr = await buildContractCall(callerPublicKey, 'cancel', args);
  return await signAndSubmit(txXdr);
}

// ─────────────────────────────────────────
//  READ-ONLY QUERIES (no wallet needed)
// ─────────────────────────────────────────

export interface OnChainBet {
  bettor: string;
  option_idx: number;
  amount: number; // In XLM
}

export interface OnChainRoom {
  id: number;
  creator: string;
  token: string;
  description: string;
  options: string[];
  stake_amount: number; // In XLM
  expiry_ledger: number;
  status: 'Open' | 'Resolved' | 'Cancelled';
  bets: OnChainBet[];
  total_pool: number; // In XLM
  winning_option: number;
}

function parseRoom(scVal: StellarSdk.xdr.ScVal, roomId: number): OnChainRoom {
  const native = StellarSdk.scValToNative(scVal);

  const statusMap: Record<string, 'Open' | 'Resolved' | 'Cancelled'> = {
    'Open': 'Open',
    'Resolved': 'Resolved',
    'Cancelled': 'Cancelled',
  };

  // Parse status from enum
  let status: 'Open' | 'Resolved' | 'Cancelled' = 'Open';
  if (typeof native.status === 'string') {
    status = statusMap[native.status] || 'Open';
  } else if (native.status && typeof native.status === 'object') {
    const key = Object.keys(native.status)[0] || Object.keys(statusMap).find(k => native.status[k] !== undefined) || 'Open';
    status = statusMap[key] || 'Open';
  }

  const bets: OnChainBet[] = (native.bets || []).map((b: any) => ({
    bettor: typeof b.bettor === 'string' ? b.bettor : b.bettor.toString(),
    option_idx: Number(b.option_idx),
    amount: Number(b.amount) / 10_000_000,
  }));

  return {
    id: roomId,
    creator: typeof native.creator === 'string' ? native.creator : native.creator.toString(),
    token: typeof native.token === 'string' ? native.token : native.token.toString(),
    description: native.description?.toString() || '',
    options: (native.options || []).map((o: any) => o.toString()),
    stake_amount: Number(native.stake_amount) / 10_000_000,
    expiry_ledger: Number(native.expiry_ledger),
    status,
    bets,
    total_pool: Number(native.total_pool) / 10_000_000,
    winning_option: Number(native.winning_option),
  };
}

export async function getRoom(roomId: number): Promise<OnChainRoom | null> {
  const args = [
    StellarSdk.nativeToScVal(BigInt(roomId), { type: 'u64' }),
  ];

  const result = await readContract('get_room', args);
  if (!result) return null;

  try {
    return parseRoom(result, roomId);
  } catch (e) {
    console.error('Failed to parse room:', e);
    return null;
  }
}

export async function getRoomCount(): Promise<number> {
  const result = await readContract('get_room_count', []);
  if (!result) return 0;
  return Number(StellarSdk.scValToNative(result));
}

export async function getAllRooms(): Promise<OnChainRoom[]> {
  const count = await getRoomCount();
  const rooms: OnChainRoom[] = [];

  for (let i = 1; i <= count; i++) {
    const room = await getRoom(i);
    if (room) rooms.push(room);
  }

  return rooms;
}

export async function getUserRooms(walletAddress: string): Promise<OnChainRoom[]> {
  const all = await getAllRooms();
  return all.filter(r =>
    r.creator === walletAddress ||
    r.bets.some(b => b.bettor === walletAddress)
  );
}

// ─────────────────────────────────────────
//  BALANCE HELPERS
// ─────────────────────────────────────────

export async function getXLMBalance(address: string): Promise<number | null> {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
    if (!response.ok) return null;
    const data = await response.json();
    const xlm = data.balances.find(
      (b: { asset_type: string }) => b.asset_type === 'native'
    );
    return xlm ? parseFloat(xlm.balance) : 0;
  } catch {
    return null;
  }
}

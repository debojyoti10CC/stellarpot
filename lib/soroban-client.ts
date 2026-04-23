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
//  UNIQUE ROOM CODE GENERATION
//  Obfuscates the serial on-chain room ID
//  to prevent casual URL guessing.
// ─────────────────────────────────────────

const OBFUSCATION_SALT = 8472619;

export function getRoomCodeFromId(roomId: number): string {
  // Simple reversible obfuscation
  const obfuscated = (roomId ^ OBFUSCATION_SALT) * 7;
  return obfuscated.toString(36).toUpperCase();
}

export function getRoomIdFromCode(code: string): number | null {
  try {
    const parsed = parseInt(code.toLowerCase(), 36);
    if (isNaN(parsed)) return null;
    const roomId = (parsed / 7) ^ OBFUSCATION_SALT;
    if (roomId <= 0 || !Number.isInteger(roomId)) return null;
    return roomId;
  } catch {
    return null;
  }
}

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
    // Map contract error codes to human-readable messages
    const CONTRACT_ERRORS: Record<number, string> = {
      1: 'Contract not initialized. The admin must call initialize() first.',
      2: 'Room not found. This room does not exist on-chain.',
      3: 'Room is not open. It may have already been resolved or cancelled.',
      4: 'You have already placed a bet in this room.',
      5: 'Invalid option selected.',
      6: 'Only the room creator can perform this action.',
      7: 'Room has not expired yet.',
      8: 'Insufficient funds to place this bet.',
      9: 'No bets have been placed in this room yet.',
      10: 'No winners found.',
      11: 'Contract has already been initialized.',
    };

    const simErr = simulated as any;
    const rawError = simErr.error || '';
    
    // Try to extract the error code from "Error(Contract, #N)"
    const codeMatch = rawError.match(/Error\(Contract,\s*#(\d+)\)/);
    if (codeMatch) {
      const code = parseInt(codeMatch[1], 10);
      const friendly = CONTRACT_ERRORS[code] || `Unknown contract error #${code}`;
      throw new Error(friendly);
    }
    
    // Fallback: just show a clean version of the error string
    const cleanError = rawError.replace(/\{[^}]*\}/g, '').trim() || 'Transaction simulation failed';
    throw new Error(cleanError);
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
//  BUILD SOROBAN VECTORS PROPERLY
//  nativeToScVal can't correctly infer Vec<String>
//  from a JS array, so we build it manually.
// ─────────────────────────────────────────

function buildStringVec(strings: string[]): StellarSdk.xdr.ScVal {
  const scStrings = strings.map(s =>
    StellarSdk.nativeToScVal(s, { type: 'string' })
  );
  return StellarSdk.xdr.ScVal.scvVec(scStrings);
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
): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(creatorPublicKey, { type: 'address' }),
    StellarSdk.nativeToScVal(NATIVE_XLM_SAC, { type: 'address' }),
    StellarSdk.nativeToScVal(description, { type: 'string' }),
    buildStringVec(options),
    StellarSdk.nativeToScVal(BigInt(Math.round(stakeAmountXLM * 10_000_000)), { type: 'i128' }),
    StellarSdk.nativeToScVal(expiryLedgers, { type: 'u32' }),
  ];

  const txXdr = await buildContractCall(creatorPublicKey, 'create_room', args);
  const hash = await signAndSubmit(txXdr);
  console.log('Room creation tx:', hash);

  // Read room count to get the new room ID
  const countVal = await readContract('get_room_count', []);
  const roomId = countVal ? Number(StellarSdk.scValToNative(countVal)) : 1;

  // Generate unique room code and map it
  const roomCode = generateRoomCode();
  saveRoomCode(roomCode, roomId);

  return roomCode;
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
  code: string | null; // Unique room code for sharing
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

  // Parse status from Soroban enum — the SDK can return it in different shapes
  let status: 'Open' | 'Resolved' | 'Cancelled' = 'Open';
  const rawStatus = native.status;
  
  if (typeof rawStatus === 'string') {
    // Direct string: "Open", "Resolved", "Cancelled"
    if (rawStatus === 'Resolved') status = 'Resolved';
    else if (rawStatus === 'Cancelled') status = 'Cancelled';
    else status = 'Open';
  } else if (Array.isArray(rawStatus)) {
    // Some SDK versions return enums as [variantName, value]
    const variant = String(rawStatus[0]);
    if (variant === 'Resolved') status = 'Resolved';
    else if (variant === 'Cancelled') status = 'Cancelled';
  } else if (rawStatus && typeof rawStatus === 'object') {
    // Object form: { Open: undefined } or { Resolved: undefined }
    const keys = Object.keys(rawStatus);
    if (keys.includes('Resolved')) status = 'Resolved';
    else if (keys.includes('Cancelled')) status = 'Cancelled';
  }
  
  console.log(`[parseRoom] Room ${roomId} status:`, rawStatus, '→', status);

  const bets: OnChainBet[] = (native.bets || []).map((b: any) => ({
    bettor: typeof b.bettor === 'string' ? b.bettor : b.bettor.toString(),
    option_idx: Number(b.option_idx),
    amount: Number(b.amount) / 10_000_000,
  }));

  return {
    id: roomId,
    code: getRoomCodeFromId(roomId),
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

export async function getRoomByCode(code: string): Promise<OnChainRoom | null> {
  const roomId = getRoomIdFromCode(code.toUpperCase());
  if (roomId === null) return null;
  return getRoom(roomId);
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
//  PAYOUT CALCULATION HELPERS
// ─────────────────────────────────────────

export interface PayoutInfo {
  address: string;
  betAmount: number;
  payout: number;
  profit: number;
  isWinner: boolean;
}

export function calculatePayouts(room: OnChainRoom): PayoutInfo[] {
  if (room.status !== 'Resolved') return [];

  const winningIdx = room.winning_option;
  const winners = room.bets.filter(b => b.option_idx === winningIdx);
  const winnerTotal = winners.reduce((sum, b) => sum + b.amount, 0);

  return room.bets.map(bet => {
    const isWinner = bet.option_idx === winningIdx;
    let payout = 0;

    if (isWinner && winnerTotal > 0) {
      payout = (bet.amount / winnerTotal) * room.total_pool;
    } else if (winners.length === 0) {
      // No winners — everyone was refunded
      payout = bet.amount;
    }

    return {
      address: bet.bettor,
      betAmount: bet.amount,
      payout: Math.round(payout * 10_000_000) / 10_000_000,
      profit: Math.round((payout - bet.amount) * 10_000_000) / 10_000_000,
      isWinner,
    };
  });
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

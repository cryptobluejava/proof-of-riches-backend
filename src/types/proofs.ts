/**
 * @file src/types/proofs.ts
 * @description TypeScript interfaces for mock ZK proof system
 * @location Place in: proof-of-riches-backend/src/types/
 */

export interface GenerateProofRequest {
  wallet: string; // user's Ethereum address
  token: string; // token contract address (USDT, USDC, etc)
  minAmount: string; // minimum amount in wei (as string for precision)
  txHash: string; // payment transaction hash
  socialProvider?: 'twitter' | 'discord';
  socialHandle?: string;
  socialDisplayName?: string;
  tokenSymbol?: string;
  displayAmount?: string;
}

export interface ProofResponse {
  success: boolean;
  proof: string; // ZK proof bytes (hex string)
  publicInputs: string; // public signals (hex string)
  wallet: string; // user's wallet
  minAmount: string; // amount they proved
  token: string; // token address
  paymentTxHash: string; // payment confirmation
  timestamp: number; // when proof was generated
  network: 'sepolia' | 'mainnet';
  verificationCode: string; // unique ID for this proof
  socialProvider?: 'twitter' | 'discord';
  socialHandle?: string;
  socialDisplayName?: string;
  tokenSymbol?: string;
  displayAmount?: string;
}

export interface VerifyProofRequest {
  proof: string;
  publicInputs: string;
  wallet: string;
  minAmount: string;
  token: string;
  socialProvider?: 'twitter' | 'discord';
  socialHandle?: string;
  socialDisplayName?: string;
  tokenSymbol?: string;
  displayAmount?: string;
}

export interface VerifyProofResponse {
  isValid: boolean;
  message: string;
  wallet?: string;
  token?: string;
  socialProvider?: 'twitter' | 'discord';
  socialHandle?: string;
  socialDisplayName?: string;
  tokenSymbol?: string;
  displayAmount?: string;
}

// Internal service types (mock service - no real SP1 integration)

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
  network: 'sepolia' | 'mainnet';
}

export interface ProofState {
  id: string;
  wallet: string;
  token: string;
  minAmount: string;
  proof?: string;
  publicInputs?: string;
  paymentTxHash?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: number;
  expiresAt: number; // proof expiration time
  error?: string;
}

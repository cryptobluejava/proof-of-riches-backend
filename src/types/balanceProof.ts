export interface BalanceProofRequest {
  walletAddress: string;
  minBalanceUSDT: number;
}

export interface BalanceProofResult {
  success: boolean;
  proof?: {
    merkleProof: string[];
    value: string;
    blockNumber: number;
    storageSlot: string;
  };
  balance?: string;
  error?: string;
  message?: string;
}

export interface ProofData {
  id: string;
  walletAddress: string;
  balanceUSDT: string;
  minRequired: number;
  proof: {
    merkleProof: string[];
    value: string;
    blockNumber: number;
    storageSlot: string;
  };
  claimText: string;
  shareId: string;
  timestamp: number;
}


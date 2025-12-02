import { v4 as uuidv4 } from 'uuid';
import { ProofData } from '../types/balanceProof';

class ProofStorageService {
  private proofs: Map<string, ProofData> = new Map();

  saveProof(
    walletAddress: string,
    balance: string,
    minRequired: number,
    proof: ProofData['proof']
  ): ProofData {
    const shareId = uuidv4();
    const proofData: ProofData = {
      id: uuidv4(),
      walletAddress: walletAddress.toLowerCase(),
      balanceUSDT: balance,
      minRequired,
      proof,
      claimText: `Proof that wallet has ≥ ${minRequired} USDT`,
      shareId,
      timestamp: Date.now(),
    };

    this.proofs.set(shareId, proofData);
    return proofData;
  }

  getProof(shareId: string): ProofData | null {
    return this.proofs.get(shareId) || null;
  }

  getProofsByWallet(walletAddress: string): ProofData[] {
    const walletLower = walletAddress.toLowerCase();
    return Array.from(this.proofs.values()).filter(
      p => p.walletAddress === walletLower
    );
  }

  deleteProof(shareId: string): boolean {
    return this.proofs.delete(shareId);
  }
}

export default new ProofStorageService();


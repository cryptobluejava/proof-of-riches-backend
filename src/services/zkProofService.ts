/**
 * @file src/services/zkProofService.ts
 * @description Mock ZK proof generation and verification service
 * @location Place in: proof-of-riches-backend/src/services/
 */

import { ethers } from 'ethers';
import {
  GenerateProofRequest,
  ProofResponse,
  VerifyProofRequest,
  VerifyProofResponse,
} from '../types/proofs';
import { EthereumUtils } from '../utils/ethereumUtils';

class ZKProofService {
  private ethereumUtils: EthereumUtils;
  private backendWallet: string;
  private proofCostWei: string;

  constructor() {
    this.backendWallet = process.env.BACKEND_WALLET || '';
    this.proofCostWei = process.env.PROOF_COST_WEI || '1000000000000000'; // 0.001 ETH default
    this.ethereumUtils = new EthereumUtils();

    console.log('[ZKProofService] Using mock proof service (SP1 integration removed)');
  }

  /**
   * Generate mock ZK proof for token balance
   * @param request - Proof generation request with wallet, token, minAmount, and payment txHash
   * @returns Generated proof response with mock data
   */
  async generateProof(request: GenerateProofRequest): Promise<ProofResponse> {
    const startTime = Date.now();
    if (process.env.NODE_ENV === 'development') {
      console.log('[ZKProofService] Starting mock proof generation for:', {
        wallet: request.wallet,
        token: request.token,
        minAmount: request.minAmount,
        txHash: request.txHash,
      });
    }

    try {
      const network = this.ethereumUtils.getNetwork();

      // 1. Verify payment transaction (mock - always succeeds for demo)
      if (!request.txHash) {
        throw new Error('Payment transaction hash required');
      }

      // Mock payment verification - in real implementation this would check blockchain
      const paymentVerified = request.txHash.startsWith('0x') && request.txHash.length === 66;

      if (!paymentVerified) {
        throw new Error('Payment verification failed');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[ZKProofService] Payment verified (mock):', request.txHash);
      }

      // 2. Generate mock proof data
      const proofData = this.getMockProof();

      if (process.env.NODE_ENV === 'development') {
        console.log('[ZKProofService] Mock proof generated');
      }

      // 3. Generate unique verification code
      const verificationCode = this.generateVerificationCode();

      // 4. Prepare response
      const response: ProofResponse = {
        success: true,
        proof: proofData.proof,
        publicInputs: proofData.public_inputs,
        wallet: request.wallet,
        minAmount: request.minAmount,
        token: request.token,
        paymentTxHash: request.txHash,
        timestamp: Date.now(),
        network: network,
        verificationCode: verificationCode,
        socialProvider: request.socialProvider,
        socialHandle: request.socialHandle,
        socialDisplayName: request.socialDisplayName,
        tokenSymbol: request.tokenSymbol,
        displayAmount: request.displayAmount,
      };

      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(
          `[ZKProofService] Mock proof generation completed in ${duration}ms`
        );
      }

      return response;
    } catch (error) {
      console.error('[ZKProofService] Error generating mock proof:', error);
      throw error;
    }
  }

  /**
   * Verify a mock ZK proof off-chain
   * @param request - Proof verification request
   * @returns Verification result (always valid for mock)
   */
  async verifyProof(request: VerifyProofRequest): Promise<VerifyProofResponse> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ZKProofService] Verifying mock proof for wallet:', request.wallet);
      }

      // Validate addresses
      if (!ethers.isAddress(request.wallet)) {
        return {
          isValid: false,
          message: 'Invalid wallet address',
          wallet: request.wallet,
        };
      }

      if (!ethers.isAddress(request.token)) {
        return {
          isValid: false,
          message: 'Invalid token address',
          token: request.token,
        };
      }

      // Validate proof format
      if (!request.proof || request.proof.length < 10) {
        return {
          isValid: false,
          message: 'Invalid proof format',
        };
      }

      if (!request.publicInputs || request.publicInputs.length < 10) {
        return {
          isValid: false,
          message: 'Invalid public inputs',
        };
      }

      // Mock verification - always succeeds for demo purposes
      const isValid = true;

      return {
        isValid: isValid,
        message: isValid ? 'Mock proof verification successful' : 'Proof verification failed',
        wallet: request.wallet,
        token: request.token,
        socialProvider: request.socialProvider,
        socialHandle: request.socialHandle,
        socialDisplayName: request.socialDisplayName,
        tokenSymbol: request.tokenSymbol,
        displayAmount: request.displayAmount,
      };
    } catch (error) {
      console.error('[ZKProofService] Error verifying mock proof:', error);
      return {
        isValid: false,
        message: `Verification error: ${error}`,
        wallet: request.wallet,
        token: request.token,
        socialProvider: request.socialProvider,
        socialHandle: request.socialHandle,
        socialDisplayName: request.socialDisplayName,
        tokenSymbol: request.tokenSymbol,
        displayAmount: request.displayAmount,
      };
    }
  }

  /**
   * Generate mock proof data
   * @private
   */
  private getMockProof(): { proof: string; public_inputs: string; vkey_hash: string } {
    console.log('[ZKProofService] Generating mock proof data');
    return {
      proof:
        '0x' +
        'a'.repeat(256) + // Mock proof (256 hex chars)
        'b'.repeat(256),
      public_inputs:
        '0x' +
        'c'.repeat(256) + // Mock public inputs
        'd'.repeat(256),
      vkey_hash: '0x' + 'e'.repeat(64), // Mock vkey hash
    };
  }

  /**
   * Generate unique verification code for proof tracking
   * @private
   */
  private generateVerificationCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `proof_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get current network being used
   */
  getNetwork(): 'sepolia' | 'mainnet' {
    return this.ethereumUtils.getNetwork();
  }
}

// Export singleton instance
export const zkProofService = new ZKProofService();

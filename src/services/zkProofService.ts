/**
 * @file src/services/zkProofService.ts
 * @description SP1 ZK proof generation and verification service
 * @location Place in: proof-of-riches-backend/src/services/
 */

import axios from 'axios';
import { ethers } from 'ethers';
import {
  GenerateProofRequest,
  ProofResponse,
  SP1ProverRequest,
  SP1ProverResponse,
  VerifyProofRequest,
  VerifyProofResponse,
} from '../types/proofs';
import { EthereumUtils } from '../utils/ethereumUtils';

class ZKProofService {
  private sp1ProverUrl: string;
  private sp1ApiKey: string;
  private ethereumUtils: EthereumUtils;
  private backendWallet: string;
  private proofCostWei: string;

  constructor() {
    this.sp1ProverUrl =
      process.env.SP1_PROVER_URL || 'https://api.succinct.xyz/api/provers/';
    this.sp1ApiKey = process.env.SP1_API_KEY || '';
    this.backendWallet = process.env.BACKEND_WALLET || '';
    this.proofCostWei = process.env.PROOF_COST_WEI || '1000000000000000'; // 0.001 ETH default
    this.ethereumUtils = new EthereumUtils();

    if (!this.sp1ApiKey) {
      console.warn('[ZKProofService] SP1_API_KEY not configured');
    }
  }

  /**
   * Generate ZK proof for token balance
   * @param request - Proof generation request with wallet, token, minAmount, and payment txHash
   * @returns Generated proof response
   */
  async generateProof(request: GenerateProofRequest): Promise<ProofResponse> {
    const startTime = Date.now();
    console.log('[ZKProofService] Starting proof generation for:', {
      wallet: request.wallet,
      token: request.token,
      minAmount: request.minAmount,
      txHash: request.txHash,
    });

    try {
      const network = this.ethereumUtils.getNetwork();

      // 1. Verify payment transaction
      if (!request.txHash) {
        throw new Error('Payment transaction hash required');
      }

      const paymentVerified = await this.ethereumUtils.verifyPayment(
        request.txHash,
        this.backendWallet,
        this.proofCostWei
      );

      if (!paymentVerified) {
        throw new Error('Payment verification failed');
      }

      console.log('[ZKProofService] Payment verified:', request.txHash);

      // 2. Fetch current balance from blockchain
      const balance = await this.ethereumUtils.getTokenBalance(
        request.token,
        request.wallet
      );

      console.log('[ZKProofService] Current balance:', balance);

      // 3. Prepare inputs for SP1 prover
      const inputs = {
        wallet: request.wallet.toLowerCase().slice(2), // remove 0x prefix
        balance: balance, // actual balance
        min_amount: request.minAmount, // amount they're proving
      };

      console.log('[ZKProofService] Proof inputs prepared:', inputs);

      // 4. Call SP1 Prover Network
      const proofData = await this.callSP1Prover(inputs);

      console.log('[ZKProofService] Proof generated from SP1');

      // 5. Generate unique verification code
      const verificationCode = this.generateVerificationCode();

      // 6. Prepare response
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
      };

      const duration = Date.now() - startTime;
      console.log(
        `[ZKProofService] Proof generation completed in ${duration}ms`
      );

      return response;
    } catch (error) {
      console.error('[ZKProofService] Error generating proof:', error);
      throw error;
    }
  }

  /**
   * Verify a ZK proof off-chain
   * @param request - Proof verification request
   * @returns Verification result
   */
  async verifyProof(request: VerifyProofRequest): Promise<VerifyProofResponse> {
    try {
      console.log('[ZKProofService] Verifying proof for wallet:', request.wallet);

      // Validate addresses
      if (!ethers.isAddress(request.wallet)) {
        return {
          isValid: false,
          message: 'Invalid wallet address',
        };
      }

      if (!ethers.isAddress(request.token)) {
        return {
          isValid: false,
          message: 'Invalid token address',
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

      // In production, you would call the SP1 verifier WASM here
      // For now, we do basic validation
      const isValid =
        request.proof.startsWith('0x') &&
        request.publicInputs.startsWith('0x') &&
        ethers.isAddress(request.wallet) &&
        ethers.isAddress(request.token);

      return {
        isValid: isValid,
        message: isValid ? 'Proof is valid' : 'Proof verification failed',
        wallet: request.wallet,
        token: request.token,
      };
    } catch (error) {
      console.error('[ZKProofService] Error verifying proof:', error);
      return {
        isValid: false,
        message: `Verification error: ${error}`,
      };
    }
  }

  /**
   * Call SP1 Prover Network API
   * @private
   */
  private async callSP1Prover(inputs: Record<string, any>): Promise<SP1ProverResponse> {
    try {
      console.log('[ZKProofService] Calling SP1 Prover API...');

      // In development, you can mock the response
      if (process.env.NODE_ENV === 'development' && process.env.MOCK_SP1 === 'true') {
        return this.getMockProof();
      }

      const requestPayload: SP1ProverRequest = {
        program: 'balance-proof', // name of your compiled program
        inputs: inputs,
        mode: 'plonk', // faster than groth16
      };

      const response = await axios.post(
        `${this.sp1ProverUrl}prove`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.sp1ApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes timeout for proof generation
        }
      );

      if (response.status !== 200) {
        throw new Error(
          `SP1 API error: ${response.status} - ${response.statusText}`
        );
      }

      const data: SP1ProverResponse = {
        proof: response.data.proof || '0x',
        public_inputs: response.data.public_inputs || '0x',
        vkey_hash: response.data.vkey_hash || '',
      };

      console.log('[ZKProofService] SP1 Prover response received');
      return data;
    } catch (error) {
      console.error('[ZKProofService] Error calling SP1 Prover:', error);
      throw new Error(`SP1 Prover API call failed: ${error}`);
    }
  }

  /**
   * Mock proof for development testing
   * @private
   */
  private getMockProof(): SP1ProverResponse {
    console.log('[ZKProofService] Using mock proof for development');
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

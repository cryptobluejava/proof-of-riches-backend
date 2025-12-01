/**
 * @file src/routes/proofs.ts
 * @description Express routes for ZK proof generation and verification
 * @location Place in: proof-of-riches-backend/src/routes/
 * @integration Add to index.ts: import proofsRouter from './routes/proofs';
 *              Then add: app.use('/api/proofs', proofsRouter);
 */

import { Router, Request, Response } from 'express';
import { zkProofService } from '../services/zkProofService';
import { GenerateProofRequest, VerifyProofRequest } from '../types/proofs';
import { ethers } from 'ethers';

const router = Router();

/**
 * POST /api/proofs/generate-proof
 * Generate a ZK proof for token balance
 *
 * Request body:
 * {
 *   "wallet": "0x...",
 *   "token": "0x...",
 *   "minAmount": "1000000000000000000",
 *   "txHash": "0x..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "proof": "0x...",
 *   "publicInputs": "0x...",
 *   "wallet": "0x...",
 *   "minAmount": "...",
 *   "token": "0x...",
 *   "paymentTxHash": "0x...",
 *   "timestamp": 1234567890,
 *   "network": "sepolia" | "mainnet",
 *   "verificationCode": "PROOF_..."
 * }
 */
router.post('/generate-proof', async (req: Request, res: Response) => {
  try {
    console.log('[Proofs Route] POST /generate-proof requested');

    const { wallet, token, minAmount, txHash } = req.body as GenerateProofRequest;

    // 1. Validate input
    if (!wallet || !token || !minAmount || !txHash) {
      console.warn('[Proofs Route] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wallet, token, minAmount, txHash',
      });
    }

    // 2. Validate addresses
    if (!ethers.isAddress(wallet)) {
      console.warn('[Proofs Route] Invalid wallet address:', wallet);
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    if (!ethers.isAddress(token)) {
      console.warn('[Proofs Route] Invalid token address:', token);
      return res.status(400).json({
        success: false,
        error: 'Invalid token address',
      });
    }

    // 3. Validate minAmount is a valid number
    try {
      BigInt(minAmount);
    } catch (e) {
      console.warn('[Proofs Route] Invalid minAmount:', minAmount);
      return res.status(400).json({
        success: false,
        error: 'Invalid minAmount format',
      });
    }

    // 4. Validate txHash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      console.warn('[Proofs Route] Invalid txHash format:', txHash);
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format',
      });
    }

    // 5. Generate proof
    const proofResponse = await zkProofService.generateProof({
      wallet,
      token,
      minAmount,
      txHash,
    });

    console.log('[Proofs Route] Proof generated successfully:', {
      verificationCode: proofResponse.verificationCode,
      network: proofResponse.network,
    });

    res.status(200).json(proofResponse);
  } catch (error: any) {
    console.error('[Proofs Route] Error in /generate-proof:', error);

    // Send appropriate error response
    const statusCode = error.message?.includes('Payment') ? 402 : 500;
    const errorMessage =
      error.message || 'Failed to generate proof. Please try again.';

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/proofs/verify-proof
 * Verify a ZK proof off-chain
 *
 * Request body:
 * {
 *   "proof": "0x...",
 *   "publicInputs": "0x...",
 *   "wallet": "0x...",
 *   "minAmount": "...",
 *   "token": "0x..."
 * }
 *
 * Response:
 * {
 *   "isValid": true,
 *   "message": "Proof is valid",
 *   "wallet": "0x...",
 *   "token": "0x..."
 * }
 */
router.post('/verify-proof', async (req: Request, res: Response) => {
  try {
    console.log('[Proofs Route] POST /verify-proof requested');

    const { proof, publicInputs, wallet, minAmount, token } =
      req.body as VerifyProofRequest;

    // Validate input
    if (!proof || !publicInputs || !wallet || !minAmount || !token) {
      console.warn('[Proofs Route] Missing required fields for verification');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for verification',
      });
    }

    // Verify proof
    const verificationResult = await zkProofService.verifyProof({
      proof,
      publicInputs,
      wallet,
      minAmount,
      token,
    });

    console.log('[Proofs Route] Proof verification completed:', {
      isValid: verificationResult.isValid,
      wallet: verificationResult.wallet,
    });

    res.status(200).json(verificationResult);
  } catch (error: any) {
    console.error('[Proofs Route] Error in /verify-proof:', error);

    res.status(500).json({
      success: false,
      error: 'Proof verification failed',
    });
  }
});

/**
 * GET /api/proofs/network
 * Get current network (sepolia or mainnet)
 *
 * Response:
 * {
 *   "network": "sepolia" | "mainnet",
 *   "nodeEnv": "development" | "production"
 * }
 */
router.get('/network', (req: Request, res: Response) => {
  try {
    const network = zkProofService.getNetwork();
    const nodeEnv = process.env.NODE_ENV || 'development';

    console.log('[Proofs Route] Network info requested:', { network, nodeEnv });

    res.status(200).json({
      network,
      nodeEnv,
      message: `Using ${network} network (${nodeEnv} environment)`,
    });
  } catch (error) {
    console.error('[Proofs Route] Error getting network info:', error);

    res.status(500).json({
      error: 'Failed to get network information',
    });
  }
});

/**
 * GET /api/proofs/health
 * Health check for proof service
 *
 * Response:
 * {
 *   "status": "ok" | "error",
 *   "network": "sepolia" | "mainnet",
 *   "sp1Configured": true | false
 * }
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const network = zkProofService.getNetwork();
    const sp1ApiKey = process.env.SP1_API_KEY;
    const backendWallet = process.env.BACKEND_WALLET;

    const sp1Configured = !!sp1ApiKey && sp1ApiKey.length > 0;
    const walletConfigured = !!backendWallet && backendWallet.length > 42;

    const isHealthy = sp1Configured && walletConfigured;

    console.log('[Proofs Route] Health check:', {
      status: isHealthy ? 'ok' : 'error',
      network,
      sp1Configured,
      walletConfigured,
    });

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'error',
      network,
      sp1Configured,
      walletConfigured,
      message: isHealthy
        ? 'Proof service is healthy'
        : 'Proof service not properly configured',
    });
  } catch (error) {
    console.error('[Proofs Route] Error in health check:', error);

    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
    });
  }
});

export default router;

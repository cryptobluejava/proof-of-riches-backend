import { Router, Request, Response } from 'express';
import ethereumProofService from '../services/ethereumProofService';
import proofStorageService from '../services/proofStorageService';
import { BalanceProofRequest } from '../types/balanceProof';

const router = Router();

// POST /api/balance-proof/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { walletAddress, minBalanceUSDT } = req.body as BalanceProofRequest;

    // Validate input
    if (!walletAddress || minBalanceUSDT === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing walletAddress or minBalanceUSDT',
      });
    }

    // Generate proof
    const result = await ethereumProofService.generateBalanceProof(
      walletAddress,
      minBalanceUSDT
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    // Save proof
    const savedProof = proofStorageService.saveProof(
      walletAddress,
      result.balance!,
      minBalanceUSDT,
      result.proof!
    );

    res.json({
      success: true,
      proof: {
        shareId: savedProof.shareId,
        claimText: savedProof.claimText,
        balance: result.balance,
        message: result.message,
        blockNumber: result.proof!.blockNumber,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
});

// GET /api/balance-proof/:shareId
router.get('/:shareId', (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    const proof = proofStorageService.getProof(shareId);

    if (!proof) {
      return res.status(404).json({
        success: false,
        error: 'Proof not found',
      });
    }

    res.json({
      success: true,
      proof: {
        claimText: proof.claimText,
        balanceUSDT: proof.balanceUSDT,
        minRequired: proof.minRequired,
        blockNumber: proof.proof.blockNumber,
        timestamp: proof.timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/balance-proof/wallet/:address
router.get('/wallet/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const proofs = proofStorageService.getProofsByWallet(address);

    res.json({
      success: true,
      proofs: proofs.map(p => ({
        shareId: p.shareId,
        claimText: p.claimText,
        balanceUSDT: p.balanceUSDT,
        minRequired: p.minRequired,
        timestamp: p.timestamp,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/balance-proof/:shareId
router.delete('/:shareId', (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    const deleted = proofStorageService.deleteProof(shareId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Proof not found',
      });
    }

    res.json({
      success: true,
      message: 'Proof deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;


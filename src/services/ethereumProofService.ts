import Web3 from 'web3';
import { BalanceProofResult } from '../types/balanceProof';

const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_DECIMALS = 6;
const BALANCE_SLOT = 2;

class EthereumProofService {
  private web3: Web3;

  constructor(rpcUrl: string = 'https://eth.llamarpc.com') {
    this.web3 = new Web3(rpcUrl);
  }

  private calculateBalanceSlot(address: string): string {
    if (!Web3.utils.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    const addressPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
    const slotPadded = BALANCE_SLOT.toString(16).padStart(64, '0');
    const key = '0x' + addressPadded + slotPadded;
    return Web3.utils.keccak256(key);
  }

  async generateBalanceProof(
    walletAddress: string,
    minBalanceUSDT: number
  ): Promise<BalanceProofResult> {
    try {
      // Validate input
      if (!Web3.utils.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }
      if (!Number.isInteger(minBalanceUSDT) || minBalanceUSDT <= 0) {
        throw new Error('Minimum balance must be a positive integer');
      }

      // Get current block
      const blockNumber = await this.web3.eth.getBlockNumber();

      // Calculate storage slot
      const storageSlot = this.calculateBalanceSlot(walletAddress);

      // Get proof from Ethereum
      const proof = await (this.web3.eth.getProof as any)(
        USDT_ADDRESS,
        [storageSlot],
        blockNumber
      );

      // Extract balance
      const storageProof = proof.storageProof[0];
      const balanceWei = storageProof.value;
      const balance = BigInt(balanceWei) / BigInt(Math.pow(10, USDT_DECIMALS));
      const balanceUSDT = balance.toString();

      // Verify requirement
      if (BigInt(balanceUSDT) < BigInt(minBalanceUSDT)) {
        throw new Error(
          `Insufficient balance. Have ${balanceUSDT} USDT, need ${minBalanceUSDT} USDT`
        );
      }

      return {
        success: true,
        proof: {
          merkleProof: storageProof.proof,
          value: balanceWei,
          blockNumber: Number(blockNumber),
          storageSlot,
        },
        balance: balanceUSDT,
        message: `Successfully proved balance of ${balanceUSDT} USDT`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate proof',
      };
    }
  }
}

export default new EthereumProofService(
  process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
);


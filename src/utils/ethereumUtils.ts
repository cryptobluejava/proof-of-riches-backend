/**
 * @file src/utils/ethereumUtils.ts
 * @description Ethereum RPC utilities for balance checking and payment verification
 * @location Place in: proof-of-riches-backend/src/utils/
 */

import { ethers } from 'ethers';

interface NetworkConfig {
  rpcUrl: string;
  name: 'sepolia' | 'mainnet';
  chainId: number;
}

class EthereumUtils {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private erc20ABI: string[];

  constructor() {
    // Minimal ERC20 ABI for balanceOf
    this.erc20ABI = [
      'function balanceOf(address account) public view returns (uint256)',
    ];
  }

  /**
   * Initialize provider based on environment
   */
  initializeProvider(network: 'sepolia' | 'mainnet'): ethers.JsonRpcProvider {
    if (this.providers.has(network)) {
      return this.providers.get(network)!;
    }

    let rpcUrl: string;

    if (network === 'sepolia') {
      rpcUrl =
        process.env.ETH_RPC_SEPOLIA || 'https://sepolia.infura.io/v3/default';
    } else {
      rpcUrl =
        process.env.ETH_RPC_MAINNET || 'https://mainnet.infura.io/v3/default';
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.providers.set(network, provider);

    return provider;
  }

  /**
   * Get current provider based on NODE_ENV
   */
  getProvider(): ethers.JsonRpcProvider {
    const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'sepolia';
    return this.initializeProvider(network);
  }

  /**
   * Get network based on NODE_ENV
   */
  getNetwork(): 'sepolia' | 'mainnet' {
    return process.env.NODE_ENV === 'production' ? 'mainnet' : 'sepolia';
  }

  /**
   * Fetch ERC20 token balance for an address
   * @param tokenAddress - Contract address of the token
   * @param walletAddress - User's wallet address
   * @returns Balance in wei (as string for precision)
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<string> {
    try {
      const provider = this.getProvider();

      // Validate addresses
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid token address: ${tokenAddress}`);
      }
      if (!ethers.isAddress(walletAddress)) {
        throw new Error(`Invalid wallet address: ${walletAddress}`);
      }

      // Create contract instance
      const contract = new ethers.Contract(
        tokenAddress,
        this.erc20ABI,
        provider
      );

      // Fetch balance
      const balance: bigint = await contract.balanceOf(walletAddress);

      console.log(
        `[EthereumUtils] Balance of ${walletAddress} on token ${tokenAddress}: ${balance.toString()}`
      );

      return balance.toString();
    } catch (error) {
      console.error('[EthereumUtils] Error fetching balance:', error);
      throw new Error(`Failed to fetch token balance: ${error}`);
    }
  }

  /**
   * Verify that a payment transaction was received
   * @param txHash - Transaction hash to verify
   * @param toAddress - Address that should receive payment
   * @param minAmount - Minimum amount in wei
   * @returns Transaction receipt if valid
   */
  async verifyPayment(
    txHash: string,
    toAddress: string,
    minAmount: string
  ): Promise<ethers.TransactionResponse | null> {
    try {
      const provider = this.getProvider();

      // Validate inputs
      if (!ethers.isAddress(toAddress)) {
        throw new Error(`Invalid recipient address: ${toAddress}`);
      }

      // Fetch transaction
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        console.warn(`[EthereumUtils] Transaction not found: ${txHash}`);
        return null;
      }

      // Check if tx is to the correct address
      if (tx.to?.toLowerCase() !== toAddress.toLowerCase()) {
        console.warn(
          `[EthereumUtils] Payment sent to wrong address. Expected: ${toAddress}, Got: ${tx.to}`
        );
        return null;
      }

      // Check if amount is sufficient
      if (BigInt(tx.value.toString()) < BigInt(minAmount)) {
        console.warn(
          `[EthereumUtils] Insufficient payment. Expected: ${minAmount}, Got: ${tx.value.toString()}`
        );
        return null;
      }

      // Wait for confirmation
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        console.warn(`[EthereumUtils] Transaction not confirmed yet: ${txHash}`);
        return null;
      }

      if (receipt.status !== 1) {
        console.warn(`[EthereumUtils] Transaction failed: ${txHash}`);
        return null;
      }

      console.log(`[EthereumUtils] Payment verified: ${txHash}`);
      return tx;
    } catch (error) {
      console.error('[EthereumUtils] Error verifying payment:', error);
      throw new Error(`Failed to verify payment: ${error}`);
    }
  }

  /**
   * Format balance for display
   */
  formatBalance(
    balanceWei: string,
    decimals: number = 18
  ): {
    wei: string;
    formatted: string;
  } {
    try {
      const formatted = ethers.formatUnits(balanceWei, decimals);
      return { wei: balanceWei, formatted };
    } catch (error) {
      console.error('[EthereumUtils] Error formatting balance:', error);
      return { wei: balanceWei, formatted: '0' };
    }
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}

export { EthereumUtils };

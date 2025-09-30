// ABI del contrato FaucetToken
export const FAUCET_TOKEN_ABI = [
  // Funciones del Faucet
  {
    "inputs": [],
    "name": "claimTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "hasAddressClaimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFaucetUsers",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFaucetAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Funciones ERC20 relevantes
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Eventos relevantes
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "claimer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "TokensClaimed",
    "type": "event"
  }
] as const

// Tipos TypeScript para el contrato
export interface FaucetTokenContract {
  // Funciones del Faucet
  claimTokens: () => Promise<void>
  hasAddressClaimed: (address: string) => Promise<boolean>
  getFaucetUsers: () => Promise<string[]>
  getFaucetAmount: () => Promise<bigint>
  
  // Funciones ERC20
  balanceOf: (address: string) => Promise<bigint>
  transfer: (to: string, amount: bigint) => Promise<boolean>
  approve: (spender: string, amount: bigint) => Promise<boolean>
  allowance: (owner: string, spender: string) => Promise<bigint>
}

// Estados de la aplicación
export interface FaucetState {
  isConnected: boolean
  userAddress: string | null
  userBalance: bigint
  hasClaimed: boolean
  isLoading: boolean
  error: string | null
  faucetAmount: bigint
  faucetUsers: string[]
}

// Estados de carga para diferentes operaciones
export interface LoadingStates {
  claiming: boolean
  checkingStatus: boolean
  fetchingUsers: boolean
  fetchingBalance: boolean
}

// Respuestas de transacciones
export interface TransactionResponse {
  hash: string
  success: boolean
  error?: string
}

// Configuración del contrato
export const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  abi: FAUCET_TOKEN_ABI,
} as const

// Constantes útiles
export const FAUCET_CONSTANTS = {
  TOKENS_PER_CLAIM: 1000000n, // 1,000,000 tokens
  DECIMALS: 18n,
  CHAIN_ID: 11155111, // Sepolia
} as const

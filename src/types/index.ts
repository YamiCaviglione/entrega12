// Estados de la aplicación del faucet
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

// Errores específicos del contrato
export enum FaucetError {
  ALREADY_CLAIMED = 'ALREADY_CLAIMED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Tipos para el manejo de estados de la UI
export interface UIState {
  isModalOpen: boolean
  modalType: 'connect' | 'claim' | 'error' | 'success' | null
  notification: Notification | null
}

export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  txHash?: string
}

// Tipos para formateo de datos
export interface FormattedAddress {
  full: string
  short: string
  display: string
}

export interface FormattedBalance {
  raw: bigint
  formatted: string
  displayValue: string
  symbol: string
}

// Tipos para paginación de usuarios
export interface UsersPagination {
  users: string[]
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalUsers: number
}

// Tipos para validaciones
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Tipos para configuración de la aplicación
export interface AppConfig {
  contractAddress: string
  rpcUrl: string
  chainId: number
  projectId: string
  apiUrl: string
}

// Mapeado de errores a mensajes legibles
export const ERROR_MESSAGES: Record<FaucetError, string> = {
  [FaucetError.ALREADY_CLAIMED]: 'Ya has reclamado tokens anteriormente',
  [FaucetError.INSUFFICIENT_BALANCE]: 'Balance insuficiente en el contrato',
  [FaucetError.NETWORK_ERROR]: 'Error de conexión a la red',
  [FaucetError.WALLET_NOT_CONNECTED]: 'Wallet no conectada',
  [FaucetError.TRANSACTION_REJECTED]: 'Transacción rechazada por el usuario',
  [FaucetError.CONTRACT_ERROR]: 'Error en el contrato inteligente',
  [FaucetError.UNKNOWN_ERROR]: 'Error desconocido'
}

// Utilidades para formateo
export class FormatUtils {
  static formatAddress(address: string): FormattedAddress {
    const full = address
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`
    const display = short
    
    return { full, short, display }
  }

  static formatBalance(balance: bigint, decimals: number = 18, symbol: string = 'FTK'): FormattedBalance {
    const divisor = 10n ** BigInt(decimals)
    const formatted = (Number(balance) / Number(divisor)).toFixed(2)
    const displayValue = `${formatted} ${symbol}`
    
    return {
      raw: balance,
      formatted,
      displayValue,
      symbol
    }
  }

  static formatTxHash(hash: string): string {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }
}

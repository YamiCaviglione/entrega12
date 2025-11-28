import { Request } from 'express'

// Tipos para autenticación SIWE
export interface SiweMessage {
  domain: string
  address: string
  statement: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]
}

export interface AuthRequest {
  message: string
  signature: string
}

export interface AuthResponse {
  token: string
  address: string
}

// Tipos para JWT payload
export interface JwtPayload {
  address: string
  chainId: number
  iat?: number
  exp?: number
}

// Tipos para endpoints del faucet
export interface ClaimRequest {
  // El address se extrae del JWT, no del body
}

export interface ClaimResponse {
  txHash: string
  success: boolean
  message?: string
}

export interface StatusResponse {
  hasClaimed: boolean
  balance: string
  users: string[]
  faucetAmount: string
}

// Tipos para errores
export interface ApiError {
  success: false
  error: string
  code?: string
  details?: any
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Tipos para configuración del contrato
export interface ContractConfig {
  address: string
  abi: any[]
}

// Tipos para request extendido con usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: {
    address: string
    chainId: number
  }
}

// Configuración del servidor
export interface ServerConfig {
  port: number
  corsOrigin: string
  jwtSecret: string
  jwtExpiresIn: string
  privateKey: string
  rpcUrl: string
  contractAddress: string
  chainId: number
}

// Estados del nonce para SIWE
export interface NonceSession {
  nonce: string
  timestamp: number
  used: boolean
}

// Mapa de nonces activos (en memoria para simplicidad)
export const activeNonces = new Map<string, NonceSession>()
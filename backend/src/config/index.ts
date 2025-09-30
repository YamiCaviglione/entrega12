import dotenv from 'dotenv'
import { ServerConfig } from '../types'

// Cargar variables de entorno
dotenv.config()

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '8000'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  privateKey: process.env.PRIVATE_KEY || '',
  rpcUrl: process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x3e2117c19a921507ead57494bbf29032f33c7412',
  chainId: parseInt(process.env.CHAIN_ID || '11155111')
}

// Validar configuración crítica
export function validateConfig(): void {
  const required = [
    { key: 'JWT_SECRET', value: config.jwtSecret },
    { key: 'PRIVATE_KEY', value: config.privateKey },
    { key: 'CONTRACT_ADDRESS', value: config.contractAddress }
  ]

  const missing = required.filter(({ value }) => !value || value === 'your_private_key_here' || value === 'your_jwt_secret_here_use_random_string_in_production')

  if (missing.length > 0) {
    console.error('❌ Configuración faltante:')
    missing.forEach(({ key }) => {
      console.error(`   - ${key}`)
    })
    console.error('\n📝 Por favor configura estas variables en el archivo .env')
    console.error('🔐 Usa: openssl rand -hex 32 para generar JWT_SECRET')
    console.error('🔑 Obtén tu PRIVATE_KEY de tu wallet de desarrollo')
    process.exit(1)
  }

  console.log('✅ Configuración del servidor validada')
}

// ABI del contrato FaucetToken (mismo que en el frontend)
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
  }
] as const
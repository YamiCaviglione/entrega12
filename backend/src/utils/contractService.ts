import { ethers } from 'ethers'
import { config, FAUCET_TOKEN_ABI } from '../config'

export class ContractService {
  private provider: ethers.JsonRpcProvider
  private signer: ethers.Wallet
  private contract!: ethers.Contract // Usar ! para indicar que será inicializado

  constructor() {
    // Inicializar provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)
    
    // Inicializar signer con clave privada
    this.signer = new ethers.Wallet(config.privateKey, this.provider)
    
    // Inicializar contrato
    this.contract = new ethers.Contract(
      config.contractAddress,
      FAUCET_TOKEN_ABI,
      this.signer
    )

    console.log(`🔗 Conectado al contrato: ${config.contractAddress}`)
    console.log(`💼 Wallet del servidor: ${this.signer.address}`)
  }

  /**
   * Verifica si una dirección ya ha reclamado tokens
   */
  async hasAddressClaimed(address: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado')
      }
      const hasClaimed = await this.contract!.hasAddressClaimed(address)
      return Boolean(hasClaimed)
    } catch (error) {
      console.error('Error verificando si la dirección ha reclamado:', error)
      throw new Error('Error al verificar estado del faucet')
    }
  }

  /**
   * Reclama tokens para una dirección específica
   */
  async claimTokens(): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado')
      }
      console.log(`🎯 Iniciando reclamo de tokens desde: ${this.signer.address}`)
      
      // Ejecutar la transacción
      const tx = await this.contract!.claimTokens()
      console.log(`📤 Transacción enviada: ${tx.hash}`)
      
      // Esperar confirmación
      const receipt = await tx.wait()
      if (!receipt) {
        throw new Error('Error: Recibo de transacción no disponible')
      }
      console.log(`✅ Transacción confirmada en bloque: ${receipt.blockNumber}`)
      
      return tx.hash
    } catch (error: any) {
      console.error('Error reclamando tokens:', error)
      
      // Manejar errores específicos del contrato
      if (error.reason) {
        throw new Error(`Error del contrato: ${error.reason}`)
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Fondos insuficientes para la transacción')
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Error de conexión a la red')
      }
      
      throw new Error('Error inesperado al reclamar tokens')
    }
  }

  /**
   * Obtiene el balance de tokens de una dirección
   */
  async getTokenBalance(address: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado')
      }
      const balance = await this.contract!.balanceOf(address)
      if (balance === undefined || balance === null) {
        return '0'
      }
      return ethers.formatEther(balance) // Convertir de wei a ether
    } catch (error) {
      console.error('Error obteniendo balance:', error)
      throw new Error('Error al obtener balance')
    }
  }

  /**
   * Obtiene la lista de usuarios que han usado el faucet
   */
  async getFaucetUsers(): Promise<string[]> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado')
      }
      const users = await this.contract!.getFaucetUsers()
      return users || []
    } catch (error) {
      console.error('Error obteniendo usuarios del faucet:', error)
      throw new Error('Error al obtener usuarios del faucet')
    }
  }

  /**
   * Obtiene la cantidad de tokens por reclamo
   */
  async getFaucetAmount(): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado')
      }
      const amount = await this.contract!.getFaucetAmount()
      if (amount === undefined || amount === null) {
        return '0'
      }
      return ethers.formatEther(amount)
    } catch (error) {
      console.error('Error obteniendo cantidad del faucet:', error)
      throw new Error('Error al obtener cantidad del faucet')
    }
  }

  /**
   * Verifica la conexión al contrato
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado')
      }
      // Intentar obtener la cantidad del faucet como test
      const result = await this.contract!.getFaucetAmount()
      if (result !== undefined && result !== null) {
        console.log('✅ Conexión al contrato verificada')
      }
      return true
    } catch (error) {
      console.error('❌ Error de conexión al contrato:', error)
      return false
    }
  }

  /**
   * Obtiene información del balance del wallet del servidor
   */
  async getServerWalletInfo(): Promise<{address: string, balance: string}> {
    try {
      const balance = await this.provider.getBalance(this.signer.address)
      return {
        address: this.signer.address,
        balance: ethers.formatEther(balance)
      }
    } catch (error) {
      console.error('Error obteniendo info del wallet del servidor:', error)
      throw new Error('Error al obtener información del wallet')
    }
  }
}

// Instancia singleton del servicio de contrato
export const contractService = new ContractService()
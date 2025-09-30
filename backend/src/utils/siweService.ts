import { SiweMessage } from 'siwe'
import { randomBytes } from 'crypto'
import { activeNonces, NonceSession } from '../types'
import { config } from '../config'

export class SiweService {
  
  /**
   * Genera un nonce único para SIWE
   */
  static generateNonce(): string {
    const nonce = randomBytes(32).toString('hex')
    
    // Guardar el nonce en memoria con timestamp
    activeNonces.set(nonce, {
      nonce,
      timestamp: Date.now(),
      used: false
    })

    // Limpiar nonces viejos (más de 10 minutos)
    SiweService.cleanupOldNonces()
    
    console.log(`🎲 Nonce generado: ${nonce.substring(0, 8)}...`)
    return nonce
  }

  /**
   * Limpia nonces antiguos del mapa
   */
  private static cleanupOldNonces(): void {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000)
    
    for (const [nonce, session] of activeNonces.entries()) {
      if (session.timestamp < tenMinutesAgo) {
        activeNonces.delete(nonce)
      }
    }
  }

  /**
   * Valida que un nonce existe y no ha sido usado
   */
  static validateNonce(nonce: string): boolean {
    const session = activeNonces.get(nonce)
    
    if (!session) {
      console.warn(`❌ Nonce no encontrado: ${nonce.substring(0, 8)}...`)
      return false
    }

    if (session.used) {
      console.warn(`❌ Nonce ya usado: ${nonce.substring(0, 8)}...`)
      return false
    }

    // Verificar que no esté expirado (10 minutos)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000)
    if (session.timestamp < tenMinutesAgo) {
      console.warn(`❌ Nonce expirado: ${nonce.substring(0, 8)}...`)
      activeNonces.delete(nonce)
      return false
    }

    return true
  }

  /**
   * Marca un nonce como usado
   */
  static markNonceAsUsed(nonce: string): void {
    const session = activeNonces.get(nonce)
    if (session) {
      session.used = true
      activeNonces.set(nonce, session)
    }
  }

  /**
   * Genera un mensaje SIWE estándar
   */
  static generateSiweMessage(
    address: string,
    nonce: string,
    domain: string = 'localhost:8000'
  ): string {
    const message = new SiweMessage({
      domain,
      address,
      statement: 'Iniciar sesión en FaucetToken DApp',
      uri: `http://${domain}`,
      version: '1',
      chainId: config.chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
      resources: [
        'https://docs.login.xyz/',
        `http://${domain}/faucet/claim`,
        `http://${domain}/faucet/status`
      ]
    })

    return message.prepareMessage()
  }

  /**
   * Verifica una firma SIWE
   */
  static async verifySiweSignature(
    message: string,
    signature: string
  ): Promise<{ 
    success: boolean
    address?: string
    chainId?: number
    error?: string 
  }> {
    try {
      console.log('🔍 Verificando firma SIWE...')
      
      // Parsear el mensaje SIWE
      const siweMessage = new SiweMessage(message)
      
      // Validar nonce
      if (!SiweService.validateNonce(siweMessage.nonce)) {
        return {
          success: false,
          error: 'Nonce inválido o expirado'
        }
      }

      // Verificar la firma
      const result = await siweMessage.verify({ signature })
      
      if (!result.success) {
        console.warn('❌ Verificación de firma SIWE falló')
        return {
          success: false,
          error: 'Firma inválida'
        }
      }

      // Marcar nonce como usado
      SiweService.markNonceAsUsed(siweMessage.nonce)

      console.log(`✅ Firma SIWE verificada para: ${siweMessage.address}`)
      
      return {
        success: true,
        address: siweMessage.address,
        chainId: siweMessage.chainId
      }

    } catch (error: any) {
      console.error('Error verificando firma SIWE:', error)
      return {
        success: false,
        error: error.message || 'Error al verificar la firma'
      }
    }
  }

  /**
   * Valida que el mensaje SIWE tenga el formato correcto
   */
  static validateSiweMessage(message: string): boolean {
    try {
      const siweMessage = new SiweMessage(message)
      
      // Validaciones básicas
      if (!siweMessage.address) return false
      if (!siweMessage.nonce) return false
      if (siweMessage.chainId !== config.chainId) return false
      
      // Validar que el mensaje no esté expirado
      if (siweMessage.expirationTime) {
        const expiry = new Date(siweMessage.expirationTime)
        if (expiry < new Date()) return false
      }
      
      return true
    } catch (error) {
      console.error('Error validando mensaje SIWE:', error)
      return false
    }
  }

  /**
   * Obtiene estadísticas de nonces activos
   */
  static getNonceStats(): {
    active: number
    used: number
    expired: number
  } {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000)
    let active = 0
    let used = 0
    let expired = 0

    for (const session of activeNonces.values()) {
      if (session.timestamp < tenMinutesAgo) {
        expired++
      } else if (session.used) {
        used++
      } else {
        active++
      }
    }

    return { active, used, expired }
  }
}
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { JwtPayload } from '../types'

export class JwtService {
  
  /**
   * Genera un JWT token para una dirección autenticada
   */
  static generateToken(address: string, chainId: number): string {
    const payload = {
      address: address.toLowerCase(), // Normalizar a minúsculas
      chainId,
      iat: Math.floor(Date.now() / 1000)
    }

    const secret = config.jwtSecret
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado')
    }

    const token = jwt.sign(payload, secret, {
      expiresIn: config.jwtExpiresIn
    } as jwt.SignOptions)

    console.log(`🔐 Token JWT generado para: ${address}`)
    return token
  }

  /**
   * Verifica y decodifica un JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret, {
        issuer: 'faucet-backend',
        audience: 'faucet-frontend'
      }) as JwtPayload

      // Validar estructura del payload
      if (!decoded.address || !decoded.chainId) {
        throw new Error('Token payload inválido')
      }

      return decoded
    } catch (error: any) {
      console.error('Error verificando JWT:', error.message)
      
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado')
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido')
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token no válido aún')
      }
      
      throw new Error('Error de autenticación')
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }

  /**
   * Decodifica un token sin verificarlo (para debugging)
   */
  static decodeTokenUnsafe(token: string): any {
    try {
      return jwt.decode(token)
    } catch (error) {
      return null
    }
  }

  /**
   * Verifica si un token está próximo a expirar (menos de 1 hora)
   */
  static isTokenNearExpiry(decoded: JwtPayload): boolean {
    if (!decoded.exp) return false
    
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = decoded.exp - now
    const oneHour = 60 * 60
    
    return timeUntilExpiry < oneHour
  }

  /**
   * Obtiene información del token para debugging
   */
  static getTokenInfo(token: string): {
    valid: boolean
    payload?: JwtPayload
    error?: string
    expiresIn?: number
  } {
    try {
      const payload = JwtService.verifyToken(token)
      const expiresIn = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : undefined
      
      return {
        valid: true,
        payload,
        expiresIn
      }
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      }
    }
  }
}
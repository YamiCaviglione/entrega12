import { Request, Response, NextFunction } from 'express'
import { JwtService } from '../utils/jwtService'
import { AuthenticatedRequest, ApiError } from '../types'

/**
 * Middleware para verificar autenticación JWT
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization
    const token = JwtService.extractTokenFromHeader(authHeader)

    if (!token) {
      const error: ApiError = {
        success: false,
        error: 'Token de autenticación requerido',
        code: 'MISSING_TOKEN'
      }
      res.status(401).json(error)
      return
    }

    // Verificar y decodificar el token
    const decoded = JwtService.verifyToken(token)

    // Agregar información del usuario al request
    req.user = {
      address: decoded.address,
      chainId: decoded.chainId
    }

    console.log(`🔐 Usuario autenticado: ${decoded.address}`)
    next()

  } catch (error: any) {
    console.error('Error en autenticación:', error.message)
    
    const apiError: ApiError = {
      success: false,
      error: error.message,
      code: 'AUTHENTICATION_FAILED'
    }
    
    res.status(401).json(apiError)
  }
}

/**
 * Middleware opcional para verificar autenticación sin fallar
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization
    const token = JwtService.extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = JwtService.verifyToken(token)
      req.user = {
        address: decoded.address,
        chainId: decoded.chainId
      }
      console.log(`🔐 Usuario autenticado (opcional): ${decoded.address}`)
    }

    next()
  } catch (error) {
    // No fallar, solo continuar sin autenticación
    console.log('🔓 Continuando sin autenticación')
    next()
  }
}

/**
 * Middleware para validar que el usuario esté en la red correcta
 */
export function validateChainId(expectedChainId: number) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: ApiError = {
        success: false,
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      }
      res.status(401).json(error)
      return
    }

    if (req.user.chainId !== expectedChainId) {
      const error: ApiError = {
        success: false,
        error: `Red incorrecta. Se esperaba Chain ID ${expectedChainId}, pero se recibió ${req.user.chainId}`,
        code: 'WRONG_CHAIN'
      }
      res.status(400).json(error)
      return
    }

    next()
  }
}

/**
 * Middleware para logging de requests autenticados
 */
export function logAuthenticatedRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    console.log(`📝 ${req.method} ${req.path} - Usuario: ${req.user.address}`)
  } else {
    console.log(`📝 ${req.method} ${req.path} - Sin autenticar`)
  }
  next()
}
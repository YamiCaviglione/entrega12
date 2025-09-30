import { Router, Request, Response } from 'express'
import { SiweService } from '../utils/siweService'
import { JwtService } from '../utils/jwtService'
import { asyncHandler, rateLimit } from '../middleware/errorHandler'
import { AuthRequest, AuthResponse, ApiResponse } from '../types'
import { config } from '../config'

const router = Router()

/**
 * POST /auth/message
 * Genera un mensaje SIWE para que el usuario lo firme
 */
router.post('/message', rateLimit(10, 5 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  console.log('📝 Solicitud de mensaje SIWE')
  
  const { address } = req.body

  // Validar que se proporcione una dirección
  if (!address || typeof address !== 'string') {
    const error: ApiResponse = {
      success: false,
      error: 'Dirección de wallet requerida',
      code: 'MISSING_ADDRESS'
    }
    res.status(400).json(error)
    return
  }

  // Validar formato de dirección Ethereum
  const addressRegex = /^0x[a-fA-F0-9]{40}$/
  if (!addressRegex.test(address)) {
    const error: ApiResponse = {
      success: false,
      error: 'Formato de dirección inválido',
      code: 'INVALID_ADDRESS'
    }
    res.status(400).json(error)
    return
  }

  try {
    // Generar nonce único
    const nonce = SiweService.generateNonce()
    
    // Generar mensaje SIWE
    const message = SiweService.generateSiweMessage(
      address,
      nonce,
      req.get('host') || 'localhost:8000'
    )

    console.log(`✅ Mensaje SIWE generado para: ${address}`)

    const response: ApiResponse<{ message: string, nonce: string }> = {
      success: true,
      data: {
        message,
        nonce
      },
      message: 'Mensaje generado correctamente'
    }

    res.json(response)

  } catch (error: any) {
    console.error('Error generando mensaje SIWE:', error)
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Error interno al generar mensaje',
      code: 'MESSAGE_GENERATION_ERROR'
    }
    
    res.status(500).json(errorResponse)
  }
}))

/**
 * POST /auth/signin
 * Verifica la firma SIWE y genera un JWT token
 */
router.post('/signin', rateLimit(5, 5 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  console.log('🔐 Solicitud de autenticación SIWE')
  
  const { message, signature }: AuthRequest = req.body

  // Validar datos de entrada
  if (!message || !signature) {
    const error: ApiResponse = {
      success: false,
      error: 'Mensaje y firma requeridos',
      code: 'MISSING_DATA'
    }
    res.status(400).json(error)
    return
  }

  if (typeof message !== 'string' || typeof signature !== 'string') {
    const error: ApiResponse = {
      success: false,
      error: 'Mensaje y firma deben ser strings',
      code: 'INVALID_DATA_TYPE'
    }
    res.status(400).json(error)
    return
  }

  try {
    // Validar formato del mensaje SIWE
    if (!SiweService.validateSiweMessage(message)) {
      const error: ApiResponse = {
        success: false,
        error: 'Mensaje SIWE inválido',
        code: 'INVALID_SIWE_MESSAGE'
      }
      res.status(400).json(error)
      return
    }

    // Verificar la firma
    const verificationResult = await SiweService.verifySiweSignature(message, signature)

    if (!verificationResult.success) {
      console.warn(`❌ Verificación fallida: ${verificationResult.error}`)
      
      const error: ApiResponse = {
        success: false,
        error: verificationResult.error || 'Verificación de firma fallida',
        code: 'SIGNATURE_VERIFICATION_FAILED'
      }
      res.status(401).json(error)
      return
    }

    // Verificar que tengamos la información necesaria
    if (!verificationResult.address || !verificationResult.chainId) {
      const error: ApiResponse = {
        success: false,
        error: 'Información de verificación incompleta',
        code: 'INCOMPLETE_VERIFICATION'
      }
      res.status(400).json(error)
      return
    }

    // Verificar que sea la red correcta
    if (verificationResult.chainId !== config.chainId) {
      const error: ApiResponse = {
        success: false,
        error: `Red incorrecta. Se esperaba Chain ID ${config.chainId}`,
        code: 'WRONG_CHAIN'
      }
      res.status(400).json(error)
      return
    }

    // Generar JWT token
    const token = JwtService.generateToken(
      verificationResult.address,
      verificationResult.chainId
    )

    console.log(`✅ Autenticación exitosa para: ${verificationResult.address}`)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        token,
        address: verificationResult.address
      },
      message: 'Autenticación exitosa'
    }

    res.json(response)

  } catch (error: any) {
    console.error('Error en autenticación:', error)
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Error interno de autenticación',
      code: 'AUTHENTICATION_ERROR'
    }
    
    res.status(500).json(errorResponse)
  }
}))

/**
 * GET /auth/verify
 * Verifica si un token JWT es válido (endpoint opcional para debugging)
 */
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = JwtService.extractTokenFromHeader(authHeader)

  if (!token) {
    const error: ApiResponse = {
      success: false,
      error: 'Token requerido',
      code: 'MISSING_TOKEN'
    }
    res.status(400).json(error)
    return
  }

  try {
    const tokenInfo = JwtService.getTokenInfo(token)
    
    const response: ApiResponse<typeof tokenInfo> = {
      success: true,
      data: tokenInfo,
      message: 'Información del token'
    }

    res.json(response)

  } catch (error: any) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Error verificando token',
      code: 'TOKEN_VERIFICATION_ERROR'
    }
    
    res.status(400).json(errorResponse)
  }
}))

/**
 * GET /auth/stats
 * Estadísticas de nonces (para debugging)
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = SiweService.getNonceStats()
  
  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
    message: 'Estadísticas de nonces'
  }

  res.json(response)
}))

export default router
import { Router, Response } from 'express'
import { authenticateToken, validateChainId, logAuthenticatedRequest } from '../middleware/auth'
import { asyncHandler, rateLimit } from '../middleware/errorHandler'
import { contractService } from '../utils/contractService'
import { AuthenticatedRequest, ClaimResponse, StatusResponse, ApiResponse } from '../types'
import { config } from '../config'

const router = Router()

// Aplicar middleware de autenticación y logging a todas las rutas
router.use(logAuthenticatedRequest)

/**
 * POST /faucet/claim
 * Reclama tokens del faucet para el usuario autenticado
 */
router.post('/claim', 
  rateLimit(3, 10 * 60 * 1000), // Máximo 3 requests por 10 minutos
  authenticateToken,
  validateChainId(config.chainId),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log(`🎯 Solicitud de reclamo de tokens para: ${req.user!.address}`)

    try {
      // Verificar si el usuario ya ha reclamado tokens
      const hasClaimed = await contractService.hasAddressClaimed(req.user!.address)
      
      if (hasClaimed) {
        console.warn(`❌ Usuario ${req.user!.address} ya ha reclamado tokens`)
        
        const error: ApiResponse = {
          success: false,
          error: 'Ya has reclamado tokens anteriormente. Solo se permite un reclamo por dirección.',
          code: 'ALREADY_CLAIMED'
        }
        res.status(400).json(error)
        return
      }

      // Ejecutar la transacción de reclamo
      console.log(`🚀 Ejecutando reclamo de tokens para: ${req.user!.address}`)
      const txHash = await contractService.claimTokens()

      console.log(`✅ Tokens reclamados exitosamente. TX: ${txHash}`)

      const response: ApiResponse<ClaimResponse> = {
        success: true,
        data: {
          txHash,
          success: true,
          message: 'Tokens reclamados exitosamente'
        },
        message: 'Reclamo exitoso'
      }

      res.json(response)

    } catch (error: any) {
      console.error(`❌ Error reclamando tokens para ${req.user!.address}:`, error)

      // Determinar el tipo de error y responder apropiadamente
      let errorMessage = 'Error al reclamar tokens'
      let errorCode = 'CLAIM_ERROR'
      let statusCode = 500

      if (error.message.includes('already claimed') || error.message.includes('ya reclamado')) {
        errorMessage = 'Ya has reclamado tokens anteriormente'
        errorCode = 'ALREADY_CLAIMED'
        statusCode = 400
      } else if (error.message.includes('insufficient funds') || error.message.includes('fondos insuficientes')) {
        errorMessage = 'Fondos insuficientes en el contrato del faucet'
        errorCode = 'INSUFFICIENT_FUNDS'
        statusCode = 503
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = 'Error de conexión a la red blockchain'
        errorCode = 'NETWORK_ERROR'
        statusCode = 503
      }

      const errorResponse: ApiResponse = {
        success: false,
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }

      res.status(statusCode).json(errorResponse)
    }
  })
)

/**
 * GET /faucet/status/:address
 * Obtiene el estado del faucet para una dirección específica
 */
router.get('/status/:address',
  rateLimit(20, 5 * 60 * 1000), // Máximo 20 requests por 5 minutos
  authenticateToken,
  validateChainId(config.chainId),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { address } = req.params

    // Validar formato de dirección
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

    // Verificar que el usuario autenticado puede acceder a esta información
    // (por seguridad, solo permite consultar su propia dirección)
    if (address.toLowerCase() !== req.user!.address.toLowerCase()) {
      const error: ApiResponse = {
        success: false,
        error: 'Solo puedes consultar el estado de tu propia dirección',
        code: 'UNAUTHORIZED_ADDRESS'
      }
      res.status(403).json(error)
      return
    }

    console.log(`📊 Consultando estado del faucet para: ${address}`)

    try {
      // Obtener información en paralelo
      const [hasClaimed, balance, users, faucetAmount] = await Promise.all([
        contractService.hasAddressClaimed(address),
        contractService.getTokenBalance(address),
        contractService.getFaucetUsers(),
        contractService.getFaucetAmount()
      ])

      console.log(`✅ Estado obtenido para ${address}: reclamado=${hasClaimed}, balance=${balance}`)

      const statusData: StatusResponse = {
        hasClaimed,
        balance,
        users,
        faucetAmount
      }

      const response: ApiResponse<StatusResponse> = {
        success: true,
        data: statusData,
        message: 'Estado del faucet obtenido correctamente'
      }

      res.json(response)

    } catch (error: any) {
      console.error(`❌ Error obteniendo estado para ${address}:`, error)

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Error al obtener estado del faucet',
        code: 'STATUS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }

      res.status(500).json(errorResponse)
    }
  })
)

/**
 * GET /faucet/info
 * Obtiene información general del faucet (sin autenticación requerida)
 */
router.get('/info',
  rateLimit(30, 5 * 60 * 1000),
  asyncHandler(async (req, res: Response) => {
    console.log('📋 Solicitud de información general del faucet')

    try {
      const [users, faucetAmount, serverInfo] = await Promise.all([
        contractService.getFaucetUsers(),
        contractService.getFaucetAmount(),
        contractService.getServerWalletInfo()
      ])

      const info = {
        contractAddress: config.contractAddress,
        chainId: config.chainId,
        faucetAmount,
        totalUsers: users.length,
        serverWallet: serverInfo.address,
        serverBalance: serverInfo.balance
      }

      const response: ApiResponse<typeof info> = {
        success: true,
        data: info,
        message: 'Información del faucet obtenida correctamente'
      }

      res.json(response)

    } catch (error: any) {
      console.error('❌ Error obteniendo información del faucet:', error)

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Error al obtener información del faucet',
        code: 'INFO_ERROR'
      }

      res.status(500).json(errorResponse)
    }
  })
)

/**
 * GET /faucet/users
 * Obtiene la lista de usuarios que han usado el faucet
 */
router.get('/users',
  rateLimit(10, 5 * 60 * 1000),
  asyncHandler(async (req, res: Response) => {
    console.log('👥 Solicitud de lista de usuarios del faucet')

    try {
      const users = await contractService.getFaucetUsers()

      // Agregar paginación opcional
      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100) // Máximo 100
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedUsers = users.slice(startIndex, endIndex)

      const response: ApiResponse<{
        users: string[]
        pagination: {
          currentPage: number
          totalPages: number
          totalUsers: number
          usersPerPage: number
        }
      }> = {
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(users.length / limit),
            totalUsers: users.length,
            usersPerPage: limit
          }
        },
        message: 'Lista de usuarios obtenida correctamente'
      }

      res.json(response)

    } catch (error: any) {
      console.error('❌ Error obteniendo usuarios del faucet:', error)

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Error al obtener lista de usuarios',
        code: 'USERS_ERROR'
      }

      res.status(500).json(errorResponse)
    }
  })
)

export default router
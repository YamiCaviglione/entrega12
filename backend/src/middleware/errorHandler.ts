import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../types'

/**
 * Middleware global para manejo de errores
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ Error no manejado:', error)

  // Si ya se envió una respuesta, delegar al error handler por defecto
  if (res.headersSent) {
    return next(error)
  }

  // Determinar código de estado
  let statusCode = 500
  let errorCode = 'INTERNAL_ERROR'
  let message = error.message || 'Error interno del servidor'

  // Manejo de errores específicos
  if (error.name === 'ValidationError') {
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
  } else if (error.name === 'CastError') {
    statusCode = 400
    errorCode = 'INVALID_INPUT'
    message = 'Formato de datos inválido'
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    errorCode = 'INVALID_TOKEN'
    message = 'Token inválido'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    errorCode = 'TOKEN_EXPIRED'
    message = 'Token expirado'
  }

  const apiError: ApiError = {
    success: false,
    error: message,
    code: errorCode,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }

  res.status(statusCode).json(apiError)
}

/**
 * Middleware para manejar rutas no encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error: ApiError = {
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
    code: 'NOT_FOUND'
  }
  
  res.status(404).json(error)
}

/**
 * Wrapper para funciones async en rutas
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Middleware para validar Content-Type en requests POST/PUT
 */
export function validateContentType(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type']
    
    if (!contentType || !contentType.includes('application/json')) {
      const error: ApiError = {
        success: false,
        error: 'Content-Type debe ser application/json',
        code: 'INVALID_CONTENT_TYPE'
      }
      res.status(400).json(error)
      return
    }
  }
  
  next()
}

/**
 * Middleware de rate limiting básico (en memoria)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    
    // Limpiar entradas expiradas
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
    
    const clientData = rateLimitMap.get(clientId)
    
    if (!clientData) {
      rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      })
      next()
      return
    }
    
    if (now > clientData.resetTime) {
      clientData.count = 1
      clientData.resetTime = now + windowMs
      next()
      return
    }
    
    if (clientData.count >= maxRequests) {
      const error: ApiError = {
        success: false,
        error: 'Demasiadas requests. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
      res.status(429).json(error)
      return
    }
    
    clientData.count++
    next()
  }
}
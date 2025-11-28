import { useState, useCallback, useEffect } from 'react'
import { apiService, type ApiResponse, type FaucetStatus, type ClaimResult } from '../services/apiService'
import { useSiweAuth } from './useSiweAuth'

export interface ApiFaucetState {
  faucetInfo: {
    contractAddress: string
    chainId: number
    faucetAmount: string
    totalUsers: number
    serverWallet: string
    serverBalance: string
  } | null
  userStatus: FaucetStatus | null
  users: {
    list: string[]
    pagination: {
      currentPage: number
      totalPages: number
      totalUsers: number
      usersPerPage: number
    } | null
  }
  lastClaimResult: ClaimResult | null
  isLoading: {
    info: boolean
    status: boolean
    users: boolean
    claiming: boolean
  }
  error: string | null
}

export interface ApiFaucetActions {
  refreshFaucetInfo: () => Promise<void>
  refreshUserStatus: () => Promise<void>
  refreshUsers: (page?: number, limit?: number) => Promise<void>
  claimTokens: () => Promise<boolean>
  clearError: () => void
  refreshAll: () => Promise<void>
}

/**
 * Hook para interactuar con la API del faucet
 */
export function useApiFaucet(): ApiFaucetState & ApiFaucetActions {
  const { isAuthenticated, address } = useSiweAuth()

  const [state, setState] = useState<ApiFaucetState>({
    faucetInfo: null,
    userStatus: null,
    users: {
      list: [],
      pagination: null
    },
    lastClaimResult: null,
    isLoading: {
      info: false,
      status: false,
      users: false,
      claiming: false
    },
    error: null
  })

  /**
   * Actualiza información general del faucet
   */
  const refreshFaucetInfo = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, info: true },
      error: null
    }))

    try {
      const response = await apiService.getFaucetInfo()
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          faucetInfo: response.data!,
          isLoading: { ...prev.isLoading, info: false }
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Error obteniendo información del faucet',
          isLoading: { ...prev.isLoading, info: false }
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: 'Error de conexión al obtener información',
        isLoading: { ...prev.isLoading, info: false }
      }))
    }
  }, [])

  /**
   * Actualiza el estado del usuario autenticado
   */
  const refreshUserStatus = useCallback(async () => {
    if (!isAuthenticated || !address) {
      setState(prev => ({ ...prev, userStatus: null }))
      return
    }

    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, status: true },
      error: null
    }))

    try {
      const response = await apiService.getFaucetStatus(address)
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          userStatus: response.data!,
          isLoading: { ...prev.isLoading, status: false }
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Error obteniendo estado del usuario',
          isLoading: { ...prev.isLoading, status: false }
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: 'Error de conexión al obtener estado',
        isLoading: { ...prev.isLoading, status: false }
      }))
    }
  }, [isAuthenticated, address])

  /**
   * Actualiza la lista de usuarios del faucet
   */
  const refreshUsers = useCallback(async (page: number = 1, limit: number = 50) => {
    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, users: true },
      error: null
    }))

    try {
      const response = await apiService.getFaucetUsers(page, limit)
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          users: {
            list: response.data!.users,
            pagination: response.data!.pagination
          },
          isLoading: { ...prev.isLoading, users: false }
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Error obteniendo lista de usuarios',
          isLoading: { ...prev.isLoading, users: false }
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: 'Error de conexión al obtener usuarios',
        isLoading: { ...prev.isLoading, users: false }
      }))
    }
  }, [])

  /**
   * Reclama tokens del faucet
   */
  const claimTokens = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      setState(prev => ({
        ...prev,
        error: 'Debes autenticarte para reclamar tokens'
      }))
      return false
    }

    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, claiming: true },
      error: null,
      lastClaimResult: null
    }))

    try {
      console.log('🎯 Iniciando reclamo de tokens vía API...')
      const response = await apiService.claimTokens()
      
      if (response.success && response.data) {
        console.log('✅ Tokens reclamados exitosamente!')
        
        setState(prev => ({
          ...prev,
          lastClaimResult: response.data!,
          isLoading: { ...prev.isLoading, claiming: false }
        }))

        // Actualizar estado del usuario después del reclamo
        setTimeout(() => {
          refreshUserStatus()
          refreshFaucetInfo()
          refreshUsers()
        }, 2000) // Esperar 2 segundos para que se confirme la transacción

        return true
      } else {
        const errorMsg = response.error || 'Error al reclamar tokens'
        console.error('❌ Error en reclamo:', errorMsg)
        
        setState(prev => ({
          ...prev,
          error: errorMsg,
          isLoading: { ...prev.isLoading, claiming: false }
        }))
        return false
      }
    } catch (error: any) {
      console.error('❌ Error reclamando tokens:', error)
      setState(prev => ({
        ...prev,
        error: 'Error de conexión al reclamar tokens',
        isLoading: { ...prev.isLoading, claiming: false }
      }))
      return false
    }
  }, [isAuthenticated, refreshUserStatus, refreshFaucetInfo, refreshUsers])

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Actualiza toda la información
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshFaucetInfo(),
      refreshUserStatus(),
      refreshUsers()
    ])
  }, [refreshFaucetInfo, refreshUserStatus, refreshUsers])

  // Cargar información inicial
  useEffect(() => {
    refreshFaucetInfo()
    refreshUsers()
  }, [refreshFaucetInfo, refreshUsers])

  // Actualizar estado del usuario cuando cambia la autenticación
  useEffect(() => {
    refreshUserStatus()
  }, [refreshUserStatus])

  return {
    ...state,
    refreshFaucetInfo,
    refreshUserStatus,
    refreshUsers,
    claimTokens,
    clearError,
    refreshAll
  }
}

/**
 * Hook simplificado para verificar si el backend está disponible
 */
export function useBackendHealth() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsChecking(true)
    try {
      const isHealthy = await apiService.healthCheck()
      setIsOnline(isHealthy)
    } catch {
      setIsOnline(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return { isOnline, isChecking, checkHealth }
}
